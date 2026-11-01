"""Ampliar módulo Plantillas con clientes, alcances e historial."""

from alembic import op
import sqlalchemy as sa


revision = "c42a81d93e70"
down_revision = "ff5ef867ff45"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "plantillas",
        sa.Column("cliente_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "plantillas",
        sa.Column("descripcion", sa.Text(), nullable=True),
    )

    op.create_index(
        "ix_plantillas_cliente_id",
        "plantillas",
        ["cliente_id"],
    )

    op.create_foreign_key(
        "fk_plantillas_cliente_id_clientes",
        "plantillas",
        "clientes",
        ["cliente_id"],
        ["id"],
    )

    op.create_table(
        "plantilla_alcances",
        sa.Column(
            "plantilla_id",
            sa.Integer(),
            sa.ForeignKey("plantillas.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "alcance_id",
            sa.Integer(),
            sa.ForeignKey("alcances.id"),
            primary_key=True,
        ),
    )

    op.create_table(
        "plantilla_versiones",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "plantilla_id",
            sa.Integer(),
            sa.ForeignKey("plantillas.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("numero_version", sa.Integer(), nullable=False),
        sa.Column("nombre_archivo", sa.String(255), nullable=False),
        sa.Column("clave_archivo", sa.String(500), nullable=False),
        sa.Column("motivo", sa.Text(), nullable=False),
        sa.Column(
            "usuario_id",
            sa.Integer(),
            sa.ForeignKey("usuarios.id"),
            nullable=True,
        ),
        sa.Column(
            "fecha_carga",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "version_restaurada_id",
            sa.Integer(),
            sa.ForeignKey("plantilla_versiones.id"),
            nullable=True,
        ),
        sa.UniqueConstraint(
            "plantilla_id",
            "numero_version",
            name="uq_plantilla_version_numero",
        ),
    )

    op.create_index(
        "ix_plantilla_versiones_plantilla_id",
        "plantilla_versiones",
        ["plantilla_id"],
    )
    op.create_index(
        "ix_plantilla_versiones_usuario_id",
        "plantilla_versiones",
        ["usuario_id"],
    )

    # Crear el registro inicial sin inventar responsables ni mover archivos.
    bind = op.get_bind()

    plantillas = sa.table(
        "plantillas",
        sa.column("id", sa.Integer()),
        sa.column("nombre", sa.String()),
        sa.column("archivo_url", sa.String()),
        sa.column("version", sa.Integer()),
        sa.column("fecha_carga", sa.DateTime()),
    )

    versiones = sa.table(
        "plantilla_versiones",
        sa.column("plantilla_id", sa.Integer()),
        sa.column("numero_version", sa.Integer()),
        sa.column("nombre_archivo", sa.String()),
        sa.column("clave_archivo", sa.String()),
        sa.column("motivo", sa.Text()),
        sa.column("usuario_id", sa.Integer()),
        sa.column("fecha_carga", sa.DateTime()),
    )

    registros = bind.execute(
        sa.select(
            plantillas.c.id,
            plantillas.c.nombre,
            plantillas.c.archivo_url,
            plantillas.c.version,
            plantillas.c.fecha_carga,
        )
    ).all()

    for plantilla in registros:
        clave = plantilla.archivo_url or ""
        nombre_archivo = clave.replace("\\", "/").rsplit("/", 1)[-1]

        if not nombre_archivo:
            nombre_archivo = f"plantilla_{plantilla.id}"

        bind.execute(
            versiones.insert().values(
                plantilla_id=plantilla.id,
                numero_version=plantilla.version or 1,
                nombre_archivo=nombre_archivo[:255],
                clave_archivo=clave,
                motivo="Registro histórico inicial de migración",
                usuario_id=None,
                fecha_carga=plantilla.fecha_carga or sa.func.now(),
            )
        )


def downgrade() -> None:
    # El downgrade elimina el historial creado por esta migración.
    op.drop_index(
        "ix_plantilla_versiones_usuario_id",
        table_name="plantilla_versiones",
    )
    op.drop_index(
        "ix_plantilla_versiones_plantilla_id",
        table_name="plantilla_versiones",
    )
    op.drop_table("plantilla_versiones")
    op.drop_table("plantilla_alcances")

    op.drop_constraint(
        "fk_plantillas_cliente_id_clientes",
        "plantillas",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_plantillas_cliente_id",
        table_name="plantillas",
    )
    op.drop_column("plantillas", "descripcion")
    op.drop_column("plantillas", "cliente_id")
