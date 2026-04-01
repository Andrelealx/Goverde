-- CreateEnum
CREATE TYPE "StatusAtestado" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "StatusAutoInfracao" AS ENUM ('EMITIDA', 'NOTIFICADA', 'PAGA', 'CANCELADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('LICENCA', 'AUTO_INFRACAO', 'RELATORIO', 'OFICIO', 'OUTRO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "jornadaHoras" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN     "toleranciaMinutos" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "BancoHoras" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "horasTrabalhadas" DOUBLE PRECISION NOT NULL,
    "horasEsperadas" DOUBLE PRECISION NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BancoHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoBancoHoras" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "saldoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaldoBancoHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atestado" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "diasAfastamento" INTEGER NOT NULL,
    "cid" TEXT,
    "medicoNome" TEXT,
    "arquivoUrl" TEXT,
    "status" "StatusAtestado" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atestado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoInfracao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ocorrenciaId" TEXT,
    "autuadoNome" TEXT NOT NULL,
    "autuadoCpfCnpj" TEXT NOT NULL,
    "autuadoEndereco" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "artigos" TEXT,
    "valorMulta" DOUBLE PRECISION NOT NULL,
    "dataInfracao" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusAutoInfracao" NOT NULL DEFAULT 'EMITIDA',
    "fiscalId" TEXT NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoInfracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "arquivoUrl" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tamanhoBytes" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BancoHoras_usuarioId_data_key" ON "BancoHoras"("usuarioId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoBancoHoras_usuarioId_key" ON "SaldoBancoHoras"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoInfracao_tenantId_numero_key" ON "AutoInfracao"("tenantId", "numero");

-- AddForeignKey
ALTER TABLE "BancoHoras" ADD CONSTRAINT "BancoHoras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BancoHoras" ADD CONSTRAINT "BancoHoras_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoBancoHoras" ADD CONSTRAINT "SaldoBancoHoras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoBancoHoras" ADD CONSTRAINT "SaldoBancoHoras_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atestado" ADD CONSTRAINT "Atestado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atestado" ADD CONSTRAINT "Atestado_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoInfracao" ADD CONSTRAINT "AutoInfracao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoInfracao" ADD CONSTRAINT "AutoInfracao_fiscalId_fkey" FOREIGN KEY ("fiscalId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
