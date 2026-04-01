-- CreateEnum
CREATE TYPE "TipoPonto" AS ENUM ('ENTRADA', 'SAIDA', 'ALMOCO_SAIDA', 'ALMOCO_VOLTA');

-- CreateTable
CREATE TABLE "PerfilFacial" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "descritores" JSONB NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilFacial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroPonto" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoPonto" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "precisao" DOUBLE PRECISION,
    "enderecoAprox" TEXT,
    "verificacaoFacial" BOOLEAN NOT NULL DEFAULT false,
    "similaridade" DOUBLE PRECISION,
    "fotoCaptura" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroPonto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilFacial_usuarioId_key" ON "PerfilFacial"("usuarioId");

-- AddForeignKey
ALTER TABLE "PerfilFacial" ADD CONSTRAINT "PerfilFacial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPonto" ADD CONSTRAINT "RegistroPonto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPonto" ADD CONSTRAINT "RegistroPonto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
