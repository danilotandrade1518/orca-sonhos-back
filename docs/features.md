# Features - OrçaSonhos Backend

Este documento descreve todos os casos de uso (features) da aplicação OrçaSonhos, incluindo tanto os já implementados quanto os planejados para implementação futura.

## Legenda de Status

- ✅ **Implementado**: Use case completamente implementado (Domain + Application + Infrastructure)
- 🔄 **Parcialmente Implementado**: Algumas camadas implementadas, outras pendentes
- ❌ **Não Implementado**: Use case ainda não desenvolvido
- 🚧 **Em Progresso**: Use case sendo desenvolvido atualmente

---

## 📊 **Resumo Geral**

- **Total de Use Cases**: 37
- **Implementados**: 32 (86%)
- **Não Implementados**: 5 (14%)

---

## 🏦 **Gestão de Orçamentos**

### ✅ UC001: Criar Orçamento

**Status**: Implementado  
**Arquivo**: [`CreateBudgetUseCase.ts`](../src/application/use-cases/budget/create-budget/CreateBudgetUseCase.ts)

**Descrição**: Permite ao usuário criar um novo orçamento pessoal ou compartilhado.

**Ator**: Usuário autenticado

**Precondições**:

- Usuário logado no sistema

**Fluxo Principal**:

1. Usuário acessa seção de orçamentos
2. Clica em "Novo Orçamento"
3. Preenche nome do orçamento
4. Define se é pessoal ou compartilhado
5. Confirma criação
6. Sistema valida dados
7. Sistema cria orçamento
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ter entre 2-100 caracteres
- ✅ Tipo deve ser PERSONAL ou SHARED
- ✅ Orçamento criado deve aparecer na lista

---

### ✅ UC002: Alternar Orçamento

**Status**: Implementado  
**Arquivo**: [`UpdateBudgetUseCase.ts`](../src/application/use-cases/budget/update-budget/UpdateBudgetUseCase.ts)

**Descrição**: Permite ao usuário alterar dados de um orçamento existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona orçamento
2. Clica em "Editar"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida dados
6. Sistema atualiza orçamento
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ser único para o usuário
- ✅ Alterações devem ser propagadas para participantes

---

### ✅ UC003: Adicionar Usuário ao Orçamento

**Status**: Implementado  
**Arquivo**: [`AddParticipantToBudgetUseCase.ts`](../src/application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase.ts)

**Descrição**: Adiciona um usuário existente a um orçamento compartilhado.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Orçamento do tipo SHARED
- Usuário a ser adicionado existe no sistema

**Fluxo Principal**:

1. Usuário acessa gestão de participantes
2. Clica em "Adicionar Usuário"
3. Busca usuário por email ou ID
4. Seleciona usuário desejado
5. Confirma adição
6. Sistema valida dados
7. Sistema adiciona usuário ao orçamento
8. Sistema notifica usuário adicionado

**Critérios de Aceitação**:

- ✅ Usuário não pode já estar no orçamento
- ✅ Apenas orçamentos SHARED podem receber participantes
- ✅ Todo usuário adicionado tem acesso total ao orçamento
- ✅ Sistema valida tipos de orçamento automaticamente

**Domain Components**:

- `BudgetType` - Value Object para tipos PERSONAL/SHARED
- `BudgetNotSharedError` - Erro quando tenta adicionar a orçamento pessoal
- `ParticipantAlreadyExistsError` - Erro quando participante já existe

---

### ✅ UC004: Remover Participante

**Status**: Implementado  
**Arquivo**: [`RemoveParticipantFromBudgetUseCase.ts`](../src/application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase.ts)

**Descrição**: Remove um participante de um orçamento compartilhado.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Participante existe no orçamento

**Fluxo Principal**:

1. Usuário acessa lista de participantes
2. Seleciona participante
3. Clica em "Remover"
4. Confirma remoção
5. Sistema valida dados
6. Sistema remove participante
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Não pode remover o criador do orçamento
- ✅ Dados do participante são preservados no histórico

---

### ✅ UC005: Excluir Orçamento

**Status**: Implementado  
**Arquivo**: [`DeleteBudgetUseCase.ts`](../src/application/use-cases/budget/delete-budget/DeleteBudgetUseCase.ts)

**Descrição**: Permite excluir um orçamento que não possui dependências.

**Ator**: Usuário proprietário do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário é proprietário do orçamento
- Orçamento não possui contas ativas
- Orçamento não possui transações

**Fluxo Principal**:

1. Usuário acessa configurações do orçamento
2. Clica em "Excluir Orçamento"
3. Sistema verifica dependências
4. Sistema solicita confirmação
5. Usuário confirma exclusão
6. Sistema valida propriedade
7. Sistema remove orçamento
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Apenas proprietário pode excluir
- ✅ Não pode excluir orçamento com contas ativas
- ✅ Não pode excluir orçamento com transações
- ✅ Exclusão é permanente

---

## 💰 **Gestão de Contas**

### ✅ UC006: Criar Conta

**Status**: Implementado  
**Arquivo**: [`CreateAccountUseCase.ts`](../src/application/use-cases/account/create-account/CreateAccountUseCase.ts)

**Descrição**: Permite ao usuário criar uma nova conta bancária ou financeira.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário acessa seção de contas
2. Clica em "Nova Conta"
3. Preenche dados da conta
4. Seleciona tipo de conta
5. Define saldo inicial (opcional)
6. Confirma criação
7. Sistema valida dados
8. Sistema cria conta
9. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ter entre 2-50 caracteres
- ✅ Tipo deve ser válido (CHECKING, SAVINGS, etc.)
- ✅ Saldo inicial pode ser zero ou positivo
- ✅ Conta criada deve aparecer na lista

---

### ✅ UC007: Editar Conta

**Status**: Implementado  
**Arquivo**: [`UpdateAccountUseCase.ts`](../src/application/use-cases/account/update-account/UpdateAccountUseCase.ts)

**Descrição**: Permite ao usuário editar dados de uma conta existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta existe no orçamento

**Fluxo Principal**:

1. Usuário seleciona conta
2. Clica em "Editar"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida dados
6. Sistema atualiza conta
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ser único no orçamento
- ✅ Tipo pode ser alterado se não houver restrições
- ✅ Saldo não pode ser alterado diretamente

---

### ✅ UC008: Excluir Conta

**Status**: Implementado  
**Arquivo**: [`DeleteAccountUseCase.ts`](../src/application/use-cases/account/delete-account/DeleteAccountUseCase.ts)

**Descrição**: Permite ao usuário excluir uma conta financeira.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta existe no orçamento
- Conta não possui transações pendentes

**Fluxo Principal**:

1. Usuário seleciona conta
2. Clica em "Excluir"
3. Sistema verifica dependências
4. Usuário confirma exclusão
5. Sistema valida acesso
6. Sistema marca conta como excluída
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Não pode excluir conta com saldo diferente de zero
- ✅ Não pode excluir conta com transações ativas
- ✅ Exclusão é lógica (soft delete)


---

### ✅ UC009: Transferir entre Contas

**Status**: Implementado  
**Arquivo**: [`TransferBetweenAccountsUseCase.ts`](../src/application/use-cases/account/transfer-between-accounts/TransferBetweenAccountsUseCase.ts)

**Descrição**: Permite transferir valores entre contas do mesmo orçamento.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Ambas as contas existem no orçamento
- Conta origem tem saldo suficiente

**Fluxo Principal**:

1. Usuário acessa transferências
2. Seleciona conta de origem
3. Seleciona conta de destino
4. Informa valor da transferência
5. Adiciona descrição (opcional)
6. Confirma transferência
7. Sistema valida saldo
8. Sistema executa transferência atomicamente
9. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Valor deve ser positivo
- ✅ Conta origem deve ter saldo suficiente
- ✅ Operação deve ser atômica (Unit of Work)
- ✅ Duas transações são criadas (débito e crédito)

---

### ✅ UC010: Reconciliar Saldo

**Status**: Implementado
**Arquivo**: [`ReconcileAccountUseCase.ts`](../src/application/use-cases/account/reconcile-account/ReconcileAccountUseCase.ts)

**Descrição**: Permite ajustar o saldo da conta baseado no extrato bancário real.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta existe no orçamento

**Fluxo Principal**:

1. Usuário seleciona conta
2. Clica em "Reconciliar"
3. Informa saldo real da conta
4. Sistema calcula diferença
5. Usuário confirma ou ajusta
6. Sistema cria transação de ajuste
7. Sistema atualiza saldo
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Diferença deve ser justificada
- ✅ Transação de ajuste é claramente identificada
- ✅ Histórico de reconciliações é mantido


---

## 💸 **Gestão de Transações**

### ✅ UC011: Lançar Receita

**Status**: Implementado (via CreateTransactionUseCase)  
**Arquivo**: [`CreateTransactionUseCase.ts`](../src/application/use-cases/transaction/create-transaction/CreateTransactionUseCase.ts)

**Descrição**: Permite ao usuário registrar uma receita (entrada de dinheiro).

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta de destino existe
- Categoria de receita existe

**Fluxo Principal**:

1. Usuário acessa lançamento de transações
2. Seleciona "Receita"
3. Preenche descrição
4. Informa valor
5. Seleciona conta de destino
6. Seleciona categoria
7. Define data (padrão: hoje)
8. Confirma lançamento
9. Sistema valida dados
10. Sistema cria transação
11. Sistema atualiza saldo da conta
12. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Valor deve ser positivo
- ✅ Descrição obrigatória (min 2 caracteres)
- ✅ Categoria deve ser do tipo INCOME
- ✅ Saldo da conta é incrementado

---

### ✅ UC012: Lançar Despesa

**Status**: Implementado (via CreateTransactionUseCase)  
**Arquivo**: [`CreateTransactionUseCase.ts`](../src/application/use-cases/transaction/create-transaction/CreateTransactionUseCase.ts)

**Descrição**: Permite ao usuário registrar uma despesa (saída de dinheiro).

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta de origem existe
- Conta tem saldo suficiente
- Categoria de despesa existe

**Fluxo Principal**:

1. Usuário acessa lançamento de transações
2. Seleciona "Despesa"
3. Preenche descrição
4. Informa valor
5. Seleciona conta de origem
6. Seleciona categoria
7. Define data (padrão: hoje)
8. Confirma lançamento
9. Sistema valida dados
10. Sistema verifica saldo
11. Sistema cria transação
12. Sistema atualiza saldo da conta
13. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Valor deve ser positivo
- ✅ Descrição obrigatória (min 2 caracteres)
- ✅ Categoria deve ser do tipo EXPENSE
- ✅ Conta deve ter saldo suficiente
- ✅ Saldo da conta é decrementado


---

### ✅ UC013: Registrar Transação (Qualquer Data)

**Status**: Implementado (via CreateTransactionUseCase)
**Arquivo**: [`CreateTransactionUseCase.ts`](../src/application/use-cases/transaction/create-transaction/CreateTransactionUseCase.ts)

**Descrição**: Permite registrar transações com data passada, presente ou futura, com status determinado automaticamente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta existe
- Categoria existe

**Fluxo Principal**:

1. Usuário acessa lançamento de transações
2. Preenche dados da transação
3. Define data (passada, presente ou futura)
4. Confirma registro
5. Sistema valida dados
6. Sistema determina status baseado na data
7. Sistema cria transação
8. Sistema atualiza saldo (se aplicável)
9. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Data futura → Status SCHEDULED (UC014: Agendar Transação Futura)
- ✅ Data presente/passada → Status COMPLETED (UC015: Registrar Transação Passada)
- ✅ Transações passadas afetam histórico
- ✅ Transações futuras não afetam saldo atual

---

### ✅ UC015: Marcar Transação como Atrasada

**Status**: Implementado
**Arquivo**: [`MarkTransactionLateUseCase.ts`](../src/application/use-cases/transaction/mark-transaction-late/MarkTransactionLateUseCase.ts)

**Descrição**: Marca transações agendadas como atrasadas quando a data passou e não foram executadas.

**Ator**: Sistema automático ou Usuário

**Precondições**:

- Transação está agendada (SCHEDULED)
- Data de execução passou
- Transação não foi executada

**Fluxo Principal**:

1. Sistema ou usuário identifica transação vencida
2. Sistema valida se pode ser marcada como atrasada
3. Sistema marca transação como LATE
4. Sistema registra alteração
5. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Apenas transações SCHEDULED podem ser marcadas
- ✅ Data deve ter passado
- ✅ Status muda para LATE

---

### ✅ UC014: Cancelar Transação Agendada

**Status**: Implementado
**Arquivo**: [`CancelScheduledTransactionUseCase.ts`](../src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase.ts)

**Descrição**: Permite cancelar uma transação que foi agendada para o futuro.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Transação está agendada
- Transação ainda não foi executada

**Fluxo Principal**:

1. Usuário acessa transações agendadas
2. Seleciona transação a cancelar
3. Clica em "Cancelar"
4. Confirma cancelamento
5. Sistema valida acesso
6. Sistema cancela agendamento
7. Sistema registra cancelamento
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Apenas transações não executadas podem ser canceladas
- ✅ Motivo do cancelamento é registrado
- ✅ Histórico preserva o cancelamento

---

### ✅ UC016: Editar Transação

**Status**: Implementado  
**Arquivo**: [`UpdateTransactionUseCase.ts`](../src/application/use-cases/transaction/update-transaction/UpdateTransactionUseCase.ts)

**Descrição**: Permite editar dados de uma transação existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Transação existe
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona transação
2. Clica em "Editar"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida dados
6. Sistema atualiza transação
7. Sistema recalcula saldos se necessário
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Alterações de valor recalculam saldos
- ✅ Histórico de alterações é mantido
- ✅ Validações são reaplicadas

---

### ✅ UC017: Excluir Transação

**Status**: Implementado  
**Arquivo**: [`DeleteTransactionUseCase.ts`](../src/application/use-cases/transaction/delete-transaction/DeleteTransactionUseCase.ts)

**Descrição**: Permite excluir uma transação existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Transação existe
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona transação
2. Clica em "Excluir"
3. Confirma exclusão
4. Sistema valida acesso
5. Sistema remove transação
6. Sistema ajusta saldos
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Saldos são recalculados automaticamente
- ✅ Exclusão é registrada no histórico
- ✅ Operação é reversível por período limitado

---

## 📂 **Gestão de Categorias**

### ✅ UC018: Criar Categoria

**Status**: Implementado  
**Arquivo**: [`CreateCategoryUseCase.ts`](../src/application/use-cases/category/create-category/CreateCategoryUseCase.ts)

**Descrição**: Permite ao usuário criar uma nova categoria para classificar transações.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário acessa seção de categorias
2. Clica em "Nova Categoria"
3. Preenche nome da categoria
4. Seleciona tipo (Receita/Despesa)
5. Escolhe ícone (opcional)
6. Define cor (opcional)
7. Confirma criação
8. Sistema valida dados
9. Sistema cria categoria
10. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ter entre 2-50 caracteres
- ✅ Tipo deve ser INCOME ou EXPENSE
- ✅ Não pode haver duplicatas no mesmo orçamento
- ✅ Categoria criada deve aparecer nas listas

---

### ✅ UC019: Editar Categoria

**Status**: Implementado  
**Arquivo**: [`UpdateCategoryUseCase.ts`](../src/application/use-cases/category/update-category/UpdateCategoryUseCase.ts)

**Descrição**: Permite editar dados de uma categoria existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Categoria existe no orçamento
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona categoria
2. Clica em "Editar"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida dados
6. Sistema atualiza categoria
7. Sistema propaga alterações
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ser único no orçamento
- ✅ Tipo não pode ser alterado se houver transações
- ✅ Alterações refletem em transações existentes

---

### ✅ UC020: Excluir Categoria

**Status**: Implementado  
**Arquivo**: [`DeleteCategoryUseCase.ts`](../src/application/use-cases/category/delete-category/DeleteCategoryUseCase.ts)

**Descrição**: Permite excluir uma categoria que não está sendo utilizada.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Categoria existe no orçamento
- Categoria não possui transações associadas
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona categoria
2. Clica em "Excluir"
3. Sistema verifica dependências
4. Usuário confirma exclusão
5. Sistema valida acesso
6. Sistema remove categoria
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Não pode excluir categoria com transações
- ✅ Sistema sugere migração de transações
- ✅ Exclusão é registrada no histórico

---

## 💳 **Gestão de Cartões de Crédito**

### ✅ UC021: Cadastrar Cartão de Crédito

**Status**: Implementado  
**Arquivo**: [`CreateCreditCardUseCase.ts`](../src/application/use-cases/credit-card/create-credit-card/CreateCreditCardUseCase.ts)

**Descrição**: Permite cadastrar um novo cartão de crédito para controle de gastos.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário acessa seção de cartões
2. Clica em "Novo Cartão"
3. Preenche dados do cartão
4. Define limite
5. Configura datas de vencimento e fechamento
6. Confirma cadastro
7. Sistema valida dados
8. Sistema cria cartão
9. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ser único no orçamento
- ✅ Limite deve ser positivo
- ✅ Datas devem ser válidas e consistentes
- ✅ Cartão criado deve aparecer na lista

---

### ✅ UC022: Editar Cartão de Crédito

**Status**: Implementado  
**Arquivo**: [`UpdateCreditCardUseCase.ts`](../src/application/use-cases/credit-card/update-credit-card/UpdateCreditCardUseCase.ts)

**Descrição**: Permite editar dados de um cartão de crédito existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Cartão existe no orçamento
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona cartão
2. Clica em "Editar"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida dados
6. Sistema atualiza cartão
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Alteração de limite afeta disponível
- ✅ Mudanças de datas afetam próximas faturas
- ✅ Histórico de alterações é mantido

---

### ✅ UC023: Excluir Cartão de Crédito

**Status**: Implementado  
**Arquivo**: [`DeleteCreditCardUseCase.ts`](../src/application/use-cases/credit-card/delete-credit-card/DeleteCreditCardUseCase.ts)

**Descrição**: Permite excluir um cartão de crédito que não possui faturas pendentes.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Cartão existe no orçamento
- Cartão não possui faturas em aberto
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona cartão
2. Clica em "Excluir"
3. Sistema verifica dependências
4. Usuário confirma exclusão
5. Sistema valida acesso
6. Sistema remove cartão
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Não pode excluir cartão com faturas abertas
- ✅ Histórico de transações é preservado
- ✅ Exclusão é registrada

---

### ✅ UC024: Criar Fatura do Cartão

**Status**: Implementado  
**Arquivo**: [`CreateCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/create-credit-card-bill/CreateCreditCardBillUseCase.ts)

**Descrição**: Cria uma nova fatura para o cartão de crédito com base nas transações do período.

**Ator**: Sistema automático ou Usuário participante do orçamento

**Precondições**:

- Cartão existe no orçamento
- Período da fatura está definido
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Sistema ou usuário solicita criação da fatura
2. Sistema calcula período da fatura
3. Sistema coleta transações do período
4. Sistema calcula valor total
5. Sistema cria fatura
6. Sistema define status inicial
7. Sistema registra fatura
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Fatura agrega transações do período correto
- ✅ Valor total está correto
- ✅ Datas de vencimento e fechamento são respeitadas
- ✅ Status inicial é "ABERTA"

---

### ✅ UC025: Atualizar Fatura do Cartão

**Status**: Implementado  
**Arquivo**: [`UpdateCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/update-credit-card-bill/UpdateCreditCardBillUseCase.ts)

**Descrição**: Atualiza dados de uma fatura do cartão de crédito existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Fatura existe no sistema
- Usuário tem acesso ao orçamento
- Fatura ainda pode ser alterada

**Fluxo Principal**:

1. Usuário seleciona fatura
2. Clica em "Editar Fatura"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida dados
6. Sistema atualiza fatura
7. Sistema recalcula totais se necessário
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Apenas faturas não pagas podem ser alteradas
- ✅ Alterações recalculam totais automaticamente
- ✅ Datas devem ser consistentes

---

### ✅ UC026: Excluir Fatura do Cartão

**Status**: Implementado  
**Arquivo**: [`DeleteCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/delete-credit-card-bill/DeleteCreditCardBillUseCase.ts)

**Descrição**: Exclui uma fatura do cartão de crédito que ainda não foi paga.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Fatura existe no sistema
- Fatura não está paga
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona fatura
2. Clica em "Excluir Fatura"
3. Sistema verifica status
4. Usuário confirma exclusão
5. Sistema valida acesso
6. Sistema remove fatura
7. Sistema libera transações associadas
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Apenas faturas não pagas podem ser excluídas
- ✅ Transações associadas são liberadas
- ✅ Exclusão é registrada no histórico

---

### ✅ UC027: Marcar Fatura como Paga

**Status**: Implementado
**Arquivo**: [`PayCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/pay-credit-card-bill/PayCreditCardBillUseCase.ts)

**Descrição**: Marca uma fatura do cartão como paga e registra o pagamento.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Fatura existe e está em aberto
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário acessa fatura em aberto
2. Clica em "Marcar como Paga"
3. Informa dados do pagamento
4. Seleciona conta de origem
5. Confirma pagamento
6. Sistema registra pagamento
7. Sistema atualiza status da fatura
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Valor do pagamento deve ser informado
- ✅ Data do pagamento é registrada
- ✅ Saldo da conta é debitado
- ✅ Validação de orçamento realizada no domain service
- ✅ Unit of Work garante atomicidade da operação

---

### ✅ UC028: Reabrir Fatura

**Status**: Implementado
**Arquivo**: [`ReopenCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase.ts)

**Descrição**: Reabre uma fatura que foi marcada como paga por engano.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Fatura está marcada como paga
- Reabrir é permitido (prazo)

**Fluxo Principal**:

1. Usuário acessa histórico de faturas
2. Seleciona fatura paga
3. Clica em "Reabrir"
4. Confirma reabertura
5. Sistema valida acesso
6. Sistema reverte pagamento
7. Sistema atualiza status
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Apenas faturas recentes podem ser reabertas
- ✅ Transação de pagamento é estornada
- ✅ Justificativa é obrigatória

---

---

## 🎯 **Gestão de Metas**

### ✅ UC029: Criar Meta

**Status**: Implementado  
**Arquivo**: [`CreateGoalUseCase.ts`](../src/application/use-cases/goal/create-goal/CreateGoalUseCase.ts)

**Descrição**: Permite criar uma meta financeira com valor objetivo e prazo.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário acessa seção de metas
2. Clica em "Nova Meta"
3. Preenche dados da meta
4. Define valor objetivo
5. Estabelece prazo
6. Configura conta vinculada
7. Confirma criação
8. Sistema valida dados
9. Sistema cria meta
10. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ter entre 2-100 caracteres
- ✅ Valor objetivo deve ser positivo
- ✅ Prazo deve ser futuro
- ✅ Conta vinculada deve existir

---

### ✅ UC030: Editar Meta

**Status**: Implementado  
**Arquivo**: [`UpdateGoalUseCase.ts`](../src/application/use-cases/goal/update-goal/UpdateGoalUseCase.ts)

**Descrição**: Permite editar dados de uma meta existente.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Meta existe no orçamento
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona meta
2. Clica em "Editar"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida dados
6. Sistema atualiza meta
7. Sistema recalcula progresso
8. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Alterações recalculam automaticamente o progresso
- ✅ Histórico de alterações é mantido
- ✅ Prazo não pode ser passado

---

### ✅ UC031: Excluir Meta

**Status**: Implementado  
**Arquivo**: [`DeleteGoalUseCase.ts`](../src/application/use-cases/goal/delete-goal/DeleteGoalUseCase.ts)

**Descrição**: Permite excluir uma meta financeira.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Meta existe no orçamento
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário seleciona meta
2. Clica em "Excluir"
3. Confirma exclusão
4. Sistema valida acesso
5. Sistema remove meta
6. Sistema preserva histórico de aportes
7. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Histórico de aportes é preservado
- ✅ Exclusão é registrada no histórico
- ✅ Aportes podem ser transferidos para conta

---

### ✅ UC032: Fazer Aporte Manual

**Status**: Implementado  
**Arquivo**: [`AddAmountToGoalUseCase.ts`](../src/application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase.ts)

**Descrição**: Permite fazer um aporte manual para uma meta específica.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Meta existe e está ativa
- Conta origem tem saldo suficiente

**Fluxo Principal**:

1. Usuário seleciona meta
2. Clica em "Fazer Aporte"
3. Informa valor do aporte
4. Seleciona conta de origem
5. Adiciona observação (opcional)
6. Confirma aporte
7. Sistema valida saldo
8. Sistema executa transferência
9. Sistema atualiza progresso da meta
10. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Valor deve ser positivo
- ✅ Conta origem deve ter saldo suficiente
- ✅ Progresso da meta é atualizado automaticamente
- ✅ Histórico de aportes é mantido

---

## 💰 **Sistema de Envelopes**

### ✅ UC033: Criar Envelope

**Status**: Implementado  
**Arquivo**: [`CreateEnvelopeUseCase.ts`](../src/application/use-cases/envelope/create-envelope/CreateEnvelopeUseCase.ts)

**Descrição**: Cria um envelope para alocação de valores por categoria.

**Ator**: Usuário participante do orçamento

**Precondições**:

- Usuário logado no sistema
- Usuário tem acesso ao orçamento

**Fluxo Principal**:

1. Usuário acessa sistema de envelopes
2. Clica em "Novo Envelope"
3. Preenche dados do envelope
4. Define limite mensal
5. Associa a categoria
6. Confirma criação
7. Sistema valida dados
8. Sistema cria envelope
9. Sistema exibe confirmação

**Critérios de Aceitação**:

- ✅ Nome deve ter entre 2-100 caracteres
- ✅ Limite mensal deve ser maior que R$ 0
- ✅ Deve estar associado a um orçamento válido
- ✅ Deve estar associado a uma categoria válida
- ✅ Envelope criado com status ACTIVE por padrão
- ✅ Sistema verifica autorização do usuário para o orçamento

**Domain Components**:

- `Envelope` - Aggregate Root independente
- `EnvelopeLimit` - Value Object para limite mensal
- `EnvelopeStatus` - Value Object para status (ACTIVE, PAUSED, ARCHIVED)
- `InvalidEnvelopeLimitError` - Erro para limite inválido
- `EnvelopeAlreadyDeletedError` - Erro para operações em envelope deletado
- `EnvelopeNotFoundError` - Erro para envelope não encontrado

---

### ❌ UC034: Editar Envelope

**Status**: Não Implementado

**Descrição**: Edita configurações de um envelope existente.

---

### ❌ UC035: Excluir Envelope

**Status**: Não Implementado

**Descrição**: Exclui um envelope que não possui saldo.

---

### ❌ UC036: Fazer Aporte no Envelope

**Status**: Não Implementado

**Descrição**: Adiciona valor a um envelope específico.

---

### ❌ UC037: Retirar Valor do Envelope

**Status**: Não Implementado

**Descrição**: Retira valor de um envelope para uso.

---

### ❌ UC038: Transferir Entre Envelopes

**Status**: Não Implementado

**Descrição**: Transfere valor entre diferentes envelopes.

---

##  **Estatísticas Finais**

- **✅ Implementados**: 32 use cases (86%)
- **❌ Não Implementados**: 5 use cases (14%)

### **Priorização Sugerida para Próximas Implementações**:

1. **Alta Prioridade** (Core Business):

   - Sistema de Envelopes (UC034-UC038)

**Observação**: Use cases de visualização, relatórios e dashboards serão tratados separadamente em camadas específicas de apresentação e não fazem parte desta documentação focada em mutação de dados.

---

**Última Atualização**: Agosto/2025 - Implementado UC033 (Criar Envelope) como agregado independente seguindo padrões DDD. Removido UC039 (Configurar Envelope Automático) e todos os use cases de Alertas e Notificações (UC040-UC046) para focar no MVP. O sistema de envelopes agora possui sua própria estrutura de domínio com entidades, value objects e casos de uso. Atualmente temos 32 use cases implementados (86%) de um total de 37 use cases do MVP. Implementação inclui cobertura completa de testes automatizados para todas as camadas (Domain, Application, Infrastructure).
