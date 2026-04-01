-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('BASICO', 'PROFISSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN_SISTEMA', 'SECRETARIO', 'FISCAL', 'OPERADOR');

-- CreateEnum
CREATE TYPE "CategoriaOcorrencia" AS ENUM ('DESMATAMENTO', 'QUEIMADA', 'RESIDUOS_ILEGAIS', 'POLUICAO_HIDRICA', 'POLUICAO_SONORA', 'FAUNA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusOcorrencia" AS ENUM ('ABERTA', 'EM_ANALISE', 'EM_CAMPO', 'RESOLVIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "TipoLicenca" AS ENUM ('INSTALACAO', 'OPERACAO', 'LOCALIZACAO', 'SIMPLIFICADA');

-- CreateEnum
CREATE TYPE "StatusLicenca" AS ENUM ('SOLICITADA', 'EM_ANALISE', 'VISTORIA_AGENDADA', 'APROVADA', 'REPROVADA', 'CANCELADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "StatusVistoria" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "slug" TEXT NOT NULL,
    "plano" "Plano" NOT NULL DEFAULT 'BASICO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'FISCAL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ocorrencia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaOcorrencia" NOT NULL,
    "status" "StatusOcorrencia" NOT NULL DEFAULT 'ABERTA',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "endereco" TEXT,
    "bairro" TEXT,
    "nomeDenunciante" TEXT,
    "contatoDenunciante" TEXT,
    "fiscalResponsavelId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcorrenciaFoto" (
    "id" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcorrenciaFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcorrenciaHistorico" (
    "id" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "statusAnterior" "StatusOcorrencia",
    "statusNovo" "StatusOcorrencia" NOT NULL,
    "comentario" TEXT,
    "visivelCidadao" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcorrenciaHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicencaAmbiental" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "tipo" "TipoLicenca" NOT NULL,
    "requerente" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "atividade" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "status" "StatusLicenca" NOT NULL DEFAULT 'SOLICITADA',
    "dataValidade" TIMESTAMP(3),
    "fiscalResponsavelId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicencaAmbiental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vistoria" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licencaId" TEXT,
    "ocorrenciaId" TEXT,
    "fiscalId" TEXT NOT NULL,
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "dataRealizada" TIMESTAMP(3),
    "status" "StatusVistoria" NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vistoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocoloSequencia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProtocoloSequencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tenantId_email_key" ON "Usuario"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Ocorrencia_tenantId_protocolo_key" ON "Ocorrencia"("tenantId", "protocolo");

-- CreateIndex
CREATE UNIQUE INDEX "LicencaAmbiental_tenantId_protocolo_key" ON "LicencaAmbiental"("tenantId", "protocolo");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocoloSequencia_tenantId_tipo_ano_key" ON "ProtocoloSequencia"("tenantId", "tipo", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_fiscalResponsavelId_fkey" FOREIGN KEY ("fiscalResponsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaFoto" ADD CONSTRAINT "OcorrenciaFoto_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaHistorico" ADD CONSTRAINT "OcorrenciaHistorico_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaHistorico" ADD CONSTRAINT "OcorrenciaHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicencaAmbiental" ADD CONSTRAINT "LicencaAmbiental_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicencaAmbiental" ADD CONSTRAINT "LicencaAmbiental_fiscalResponsavelId_fkey" FOREIGN KEY ("fiscalResponsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_licencaId_fkey" FOREIGN KEY ("licencaId") REFERENCES "LicencaAmbiental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_fiscalId_fkey" FOREIGN KEY ("fiscalId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
