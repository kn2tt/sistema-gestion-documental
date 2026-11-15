from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentUpdate,
    AssignmentEvidenceEditingUpdate,
)
from app.services.assignment_service import AssignmentService
from app.services.notification_service import NotificationService

router = APIRouter(
    prefix="/asignaciones",
    tags=["Asignaciones"],
)

@router.get(
    "/tecnico/mis-asignaciones",
    response_model=list[AssignmentResponse],
)
def listar_mis_asignaciones(
    db: Session = Depends(get_db),
    tecnico: User = Depends(require_roles("tecnico")),
):
    service = AssignmentService(db)
    return service.get_by_tecnico(tecnico.id)

@router.get(
    "/documentador/mis-asignaciones",
    response_model=list[AssignmentResponse],
)
def listar_asignaciones_documentador(
    db: Session = Depends(get_db),
    documentador: User = Depends(
        require_roles("documentador")
    ),
):
    service = AssignmentService(db)

    return service.get_by_documentador(
        documentador.id
    )

@router.get(
    "/",
    response_model=list[AssignmentResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_asignaciones(
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    return service.get_all()


@router.get(
    "/estado/{estado}",
    response_model=list[AssignmentResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_asignaciones_por_estado(
    estado: str,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        return service.get_by_estado(estado)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.get(
    "/proyecto/{proyecto_id}",
    response_model=list[AssignmentResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_asignaciones_por_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        return service.get_by_proyecto(proyecto_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )


@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse,
)
def obtener_asignacion(
    assignment_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(
        require_roles("administrador", "tecnico", "documentador")
    ),
):
    service = AssignmentService(db)
    assignment = service.get_by_id(assignment_id)

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La asignación no existe.",
        )

    rol = usuario.rol.strip().lower()

    # El documentador solo puede consultar sus asignaciones.
    if (
        rol == "documentador"
        and assignment["documentador_id"] != usuario.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta asignación.",
        )

    # El técnico solo puede consultar las asignaciones en las que participa.
    if (
        rol == "tecnico"
        and usuario.id not in (assignment.get("tecnicos_ids") or [])
        and usuario.id != assignment.get("tecnico_id")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a esta asignación.",
        )

    return assignment



@router.post(
    "/",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("administrador"))],
)
def crear_asignacion(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    administrador: User = Depends(
        require_roles("administrador")
    ),
):
    service = AssignmentService(db)

    try:
        asignacion = service.create(data)

        NotificationService.crear_para_usuarios(
            db=db,
            usuarios_ids=asignacion["tecnicos_ids"],
            tipo="asignacion_nueva",
            titulo="Nueva asignación",
            mensaje=(
                f"Se te ha asignado el proyecto "
                f"«{asignacion['proyecto_nombre']}», "
                f"site «{asignacion['site_nombre']}». "
                "Consulta los detalles de la asignación."
            ),
            actor_id=administrador.id,
            entidad_tipo="asignacion",
            entidad_id=asignacion["id"],
        )

        NotificationService.persistir(db)

        return asignacion

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )



@router.put(
    "/{assignment_id}",
    response_model=AssignmentResponse,
    dependencies=[Depends(require_roles("administrador"))],
)
def actualizar_asignacion(
    assignment_id: int,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    administrador: User = Depends(
        require_roles("administrador")
    ),
):
    service = AssignmentService(db)

    anterior = service.get_by_id(assignment_id)

    try:
        actualizada = service.update(
            assignment_id,
            data,
        )

        if anterior is None:
            return actualizada

        estado_anterior = anterior.get("estado")
        estado_nuevo = actualizada.get("estado")

        tecnicos_ids = actualizada.get("tecnicos_ids") or []
        documentador_id = actualizada.get("documentador_id")
        asignacion_id = actualizada["id"]

        codigo = f"#ASG-{asignacion_id:04d}"

        # =============================================
        # ADMINISTRADOR OBSERVA EL DOCUMENTO
        # Destinatario: documentador asignado.
        # =============================================

        if (
            estado_nuevo == "observado"
            and estado_anterior != "observado"
            and documentador_id
        ):
            NotificationService.crear_para_usuario(
                db=db,
                usuario_id=documentador_id,
                tipo="asignacion_observada",
                titulo="Documento observado",
                mensaje=(
                    f"El administrador observó el documento "
                    f"de la asignación {codigo}. "
                    "Se requieren correcciones."
                ),
                actor_id=administrador.id,
                entidad_tipo="asignacion",
                entidad_id=asignacion_id,
            )

        # =============================================
        # ADMINISTRADOR APRUEBA Y COMPLETA
        # Destinatarios: técnicos y documentador.
        # =============================================

        elif (
            estado_nuevo == "completado"
            and estado_anterior != "completado"
        ):
            destinatarios = list(tecnicos_ids)

            if documentador_id:
                destinatarios.append(documentador_id)

            NotificationService.crear_para_usuarios(
                db=db,
                usuarios_ids=destinatarios,
                tipo="asignacion_completada",
                titulo="Asignación completada",
                mensaje=(
                    f"El administrador aprobó el documento "
                    f"y completó la asignación {codigo}."
                ),
                actor_id=administrador.id,
                entidad_tipo="asignacion",
                entidad_id=asignacion_id,
            )

        # =============================================
        # CAMBIO AUTOMÁTICO A EN DOCUMENTACIÓN
        # Destinatario: documentador asignado.
        # =============================================

        elif (
            estado_nuevo == "en_documentacion"
            and estado_anterior != "en_documentacion"
            and documentador_id
        ):
            NotificationService.crear_para_usuario(
                db=db,
                usuario_id=documentador_id,
                tipo="lista_documentacion",
                titulo="Asignación lista para documentación",
                mensaje=(
                    f"La asignación {codigo} ya está lista "
                    "para iniciar el trabajo documental."
                ),
                actor_id=administrador.id,
                entidad_tipo="asignacion",
                entidad_id=asignacion_id,
            )

        # =============================================
        # ACTUALIZACIÓN DE DATOS DE LA ASIGNACIÓN
        # Destinatarios: técnicos asignados.
        # =============================================

        campos_relevantes = {
            "proyecto_id",
            "site_id",
            "subproyecto_id",
            "tipo_documento_id",
            "plantilla_id",
            "tecnicos_ids",
            "documentador_id",
            "fecha_asignacion",
            "fecha_limite",
            "especificaciones",
        }

        valores_enviados = data.model_dump(
            exclude_unset=True
        )

        hubo_cambios_relevantes = any(
            campo in valores_enviados
            for campo in campos_relevantes
        )

        if hubo_cambios_relevantes:
            NotificationService.crear_para_usuarios(
                db=db,
                usuarios_ids=tecnicos_ids,
                tipo="asignacion_actualizada",
                titulo="Asignación actualizada",
                mensaje=(
                    f"Se actualizaron datos de la asignación "
                    f"{codigo}. Consulta los detalles."
                ),
                actor_id=administrador.id,
                entidad_tipo="asignacion",
                entidad_id=asignacion_id,
            )

        NotificationService.persistir(db)

        return actualizada

    except ValueError as error:
        mensaje = str(error)

        if mensaje == "La asignación no existe.":
            codigo = status.HTTP_404_NOT_FOUND
        else:
            codigo = status.HTTP_400_BAD_REQUEST

        raise HTTPException(
            status_code=codigo,
            detail=mensaje,
        )



@router.patch(
    "/{assignment_id}/edicion-evidencias",
    dependencies=[Depends(require_roles("administrador"))],
)
def actualizar_edicion_evidencias(
    assignment_id: int,
    data: AssignmentEvidenceEditingUpdate,
    db: Session = Depends(get_db),
    administrador: User = Depends(
        require_roles("administrador")
    ),
):
    service = AssignmentService(db)

    anterior = service.get_by_id(assignment_id)

    try:
        resultado = service.actualizar_edicion_evidencias(
            assignment_id=assignment_id,
            habilitada=data.habilitada,
        )

        # Solo notificar cuando realmente se habilita
        # una edición que anteriormente estaba deshabilitada.
        if (
            data.habilitada
            and anterior is not None
            and not anterior["edicion_evidencias_habilitada"]
        ):
            asignacion = service.get_by_id(assignment_id)

            if asignacion:
                NotificationService.crear_para_usuarios(
                    db=db,
                    usuarios_ids=asignacion["tecnicos_ids"],
                    tipo="edicion_evidencias_habilitada",
                    titulo="Edición de evidencias habilitada",
                    mensaje=(
                        f"El administrador habilitó nuevamente "
                        f"la edición de evidencias de la asignación "
                        f"#ASG-{assignment_id:04d}."
                    ),
                    actor_id=administrador.id,
                    entidad_tipo="asignacion",
                    entidad_id=assignment_id,
                )

                NotificationService.persistir(db)

        return resultado

    except ValueError as error:
        mensaje = str(error)

        codigo = (
            status.HTTP_404_NOT_FOUND
            if mensaje == "La asignación no existe."
            else status.HTTP_400_BAD_REQUEST
        )

        raise HTTPException(
            status_code=codigo,
            detail=mensaje,
        )


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("administrador"))],
)
def eliminar_asignacion(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        service.delete(assignment_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    return None
