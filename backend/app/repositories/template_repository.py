
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.template import Template
from app.models.template_version import TemplateVersion


class TemplateRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, template_id: int) -> Template | None:
        statement = (
            select(Template)
            .options(
                selectinload(Template.alcances),
                selectinload(Template.versiones),
            )
            .where(Template.id == template_id)
        )
        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> list[Template]:
        statement = (
            select(Template)
            .options(
                selectinload(Template.alcances),
                selectinload(Template.versiones),
            )
            .order_by(Template.fecha_carga.desc())
        )
        return list(self.db.execute(statement).scalars().all())

    def get_by_document_type(
        self,
        document_type_id: int,
    ) -> list[Template]:
        statement = (
            select(Template)
            .where(Template.tipo_documento_id == document_type_id)
            .order_by(Template.fecha_carga.desc())
        )
        return list(self.db.execute(statement).scalars().all())

    def get_active_by_document_type(
        self,
        document_type_id: int,
    ) -> list[Template]:
        statement = (
            select(Template)
            .where(
                Template.tipo_documento_id == document_type_id,
                Template.activo.is_(True),
            )
            .order_by(Template.fecha_carga.desc())
        )
        return list(self.db.execute(statement).scalars().all())

    def find_active_same_combination(
        self,
        cliente_id: int,
        tipo_documento_id: int,
        alcances_ids: set[int],
    ) -> Template | None:
        statement = (
            select(Template)
            .options(selectinload(Template.alcances))
            .where(
                Template.cliente_id == cliente_id,
                Template.tipo_documento_id == tipo_documento_id,
                Template.activo.is_(True),
            )
        )

        templates = self.db.execute(statement).scalars().all()

        for template in templates:
            ids_existentes = {alcance.id for alcance in template.alcances}

            if ids_existentes == alcances_ids:
                return template

        return None

    def get_version(
        self,
        version_id: int,
    ) -> TemplateVersion | None:
        return self.db.get(TemplateVersion, version_id)

    def get_version_by_number(
        self,
        template_id: int,
        numero_version: int,
    ) -> TemplateVersion | None:
        statement = select(TemplateVersion).where(
            TemplateVersion.plantilla_id == template_id,
            TemplateVersion.numero_version == numero_version,
        )
        return self.db.execute(statement).scalar_one_or_none()

    def create(self, template: Template) -> Template:
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def save(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
        
    
    def get_versiones_que_dependen(
        self,
        version_id: int,
    ) -> list[TemplateVersion]:
        statement = select(TemplateVersion).where(
            TemplateVersion.version_restaurada_id == version_id
        )
        return list(
            self.db.execute(statement).scalars().all()
        )

