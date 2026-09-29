# AuditaMáq - Auditoria de Furos de Apontamento e Motomecanização (GAtec)

Sistema corporativo de alto desempenho para conferência, conciliação e auditoria de **furos de apontamento**, saltos de horímetro/odômetro e divergências operacionais de frotas agrícolas e motomecanização (padronizado com os relatórios **rptConfDigit** do ERP GAtec / SGI).

---

## 🚜 Funcionalidades Principais

* **Conferência de Informes Oficiais (rptConfDigit):**
  * Layout idêntico aos relatórios operacionais do GAtec (Barra Pêssego/Âmbar `#fed7aa`, Cabeçalho Amarelo `#fef08a`).
  * Destaque em **vermelho** na leitura inicial que apresentou furo/salto consecutivo de horímetro ou odômetro.
  * **Regra de Cruzamento de Responsabilidade:** Exibição automática do apontamento imediatamente acima do furo para identificar se quem errou foi o operador/apontador que abriu ou quem fechou o informe anterior.
* **Filtro Avançado por Nome dos Apontadores:**
  * Vínculo entre cada apontador de campo e suas respectivas fazendas.
  * Filtragem direta por nome do apontador com preservação da linha anterior para auditoria cruzada.
* **Gestão de Base de Dados:**
  * Importação de relatórios PDF oficiais do GAtec e planilhas CSV.
  * Botão **Limpar Base** para zerar apontamentos anteriores e processar novos lotes ou safras do zero.
  * Restauração rápida dos dados de exemplo e validações.
* **Exportação Profissional:**
  * Relatório em **PDF Paisagem A4** com larguras milimétricas calculadas sem corte lateral.
  * Planilha **CSV/Excel** completa com identificação de furos, operadores, apontadores e fazendas.
  * Visualização de Impressão direta no navegador (Ctrl + P).

---

## 🛠️ Tecnologias Utilizadas

* **React 18** + **TypeScript**
* **Vite** para build ultrarrápido
* **TailwindCSS** para estilização corporativa responsiva
* **Lucide React** para iconografia
* **jsPDF** & **jspdf-autotable** para geração de PDFs corporativos
* **html2canvas** & **pdfjs-dist** para parse de relatórios oficiais

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* Git instalado

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/Rodrigo12851/furos.git
   cd furos
   ```

2. **Instalar Dependências:**
   ```bash
   npm install
   ```

3. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acessar a Aplicação:**
   Abra no seu navegador: [http://localhost:3000](http://localhost:3000)

---

## 📄 Estrutura do Projeto

```
src/
├── components/          # Componentes visuais (Header, Relatório, Modais, etc.)
│   ├── OperationalReport.tsx   # Tabela oficial de conferência GAtec
│   ├── FilterBar.tsx           # Filtro por Apontador, Fazenda, Medidor
│   ├── ClearDataModal.tsx      # Modal de confirmação para limpar base
│   ├── ImportModal.tsx         # Importação de PDF e CSV
│   ├── PrintReportView.tsx     # Folha de impressão panorâmica
│   └── ...
├── data/
│   └── mockData.ts             # Dataset oficial do PDF rptConfDigit (Cristalina)
├── types/
│   └── index.ts                # Modelos de dados e interfaces TypeScript
└── utils/
    ├── auditEngine.ts          # Motor de cálculo sequencial de furos e gaps
    ├── exportEngine.ts         # Exportação para PDF A4 e planilha CSV
    └── pdfParser.ts            # Parser inteligente de PDFs do GAtec
```

---

## 👨‍💻 Autor e Repositório
* **Repositório:** [Rodrigo12851/furos](https://github.com/Rodrigo12851/furos)
* **Desenvolvido para:** Auditoria de Apontamentos e Gestão de Frotas Agrícolas.
