# Features - OrçaSonhos Backend

Este documento descreve todos os casos de uso (features) da aplicação OrçaSonhos, incluindo tanto os já implementados quanto os planejados para implementação futura.

## Legenda de Status

- ✅ **Implementado**: Use case completamente implementado (Domain + Application + Infrastructure)
- 🔄 **Parcialmente Implementado**: Algumas camadas implementadas, outras pendentes
- ❌ **Não Implementado**: Use case ainda não desenvolvido
- 🚧 **Em Progresso**: Use case sendo desenvolvido atualmente

---

## 📊 **Resumo Geral**

- **Total de Use Cases**: 60
- **Implementados**: 26 (43%)
- **Não Implementados**: 34 (57%)

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
- ✅ Usuário automaticamente vira administrador
- ✅ Orçamento criado deve aparecer na lista

**Domain Events**:
- `BudgetCreatedEvent`

---

### ✅ UC002: Alternar Orçamento
**Status**: Implementado  
**Arquivo**: [`UpdateBudgetUseCase.ts`](../src/application/use-cases/budget/update-budget/UpdateBudgetUseCase.ts)

**Descrição**: Permite ao usuário alterar dados de um orçamento existente.

**Ator**: Usuário com permissão de administrador

**Precondições**:
- Usuário logado no sistema
- Usuário tem permissão no orçamento

**Fluxo Principal**:
1. Usuário seleciona orçamento
2. Clica em "Editar"
3. Modifica dados permitidos
4. Confirma alteração
5. Sistema valida permissões
6. Sistema valida dados
7. Sistema atualiza orçamento
8. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Apenas administradores podem alterar
- ✅ Nome deve ser único para o usuário
- ✅ Alterações devem ser propagadas para participantes

**Domain Events**:
- `BudgetUpdatedEvent`

---

### ❌ UC003: Compartilhar Orçamento
**Status**: Não Implementado

**Descrição**: Permite ao usuário compartilhar um orçamento com outros usuários.

**Ator**: Usuário administrador do orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário é administrador do orçamento
- Orçamento do tipo SHARED

**Fluxo Principal**:
1. Usuário acessa orçamento compartilhado
2. Clica em "Compartilhar"
3. Gera link de convite ou digita email
4. Define permissões do convite
5. Envia convite
6. Sistema registra convite pendente
7. Sistema notifica convidado

**Critérios de Aceitação**:
- ❌ Link de convite deve expirar em 7 dias
- ❌ Convidado deve confirmar participação
- ❌ Administrador pode cancelar convites

**Domain Events**:
- `BudgetShareRequestCreatedEvent`

---

### ✅ UC004: Convidar Participante
**Status**: Implementado  
**Arquivo**: [`AddParticipantToBudgetUseCase.ts`](../src/application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase.ts)

**Descrição**: Adiciona um participante a um orçamento compartilhado.

**Ator**: Usuário administrador do orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário é administrador do orçamento
- Orçamento do tipo SHARED

**Fluxo Principal**:
1. Administrador acessa gestão de participantes
2. Clica em "Adicionar Participante"
3. Informa dados do novo participante
4. Define permissões iniciais
5. Confirma adição
6. Sistema valida dados
7. Sistema adiciona participante
8. Sistema notifica novo participante

**Critérios de Aceitação**:
- ✅ Participante não pode já estar no orçamento
- ✅ Apenas administradores podem adicionar
- ✅ Permissões padrão aplicadas automaticamente

**Domain Events**:
- `ParticipantAddedToBudgetEvent`

---

### ✅ UC005: Remover Participante
**Status**: Implementado  
**Arquivo**: [`RemoveParticipantFromBudgetUseCase.ts`](../src/application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase.ts)

**Descrição**: Remove um participante de um orçamento compartilhado.

**Ator**: Usuário administrador do orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário é administrador do orçamento
- Participante existe no orçamento

**Fluxo Principal**:
1. Administrador acessa lista de participantes
2. Seleciona participante a remover
3. Clica em "Remover"
4. Confirma remoção
5. Sistema valida permissões
6. Sistema remove participante
7. Sistema notifica participante removido

**Critérios de Aceitação**:
- ✅ Não pode remover o criador do orçamento
- ✅ Apenas administradores podem remover
- ✅ Dados do participante são preservados no histórico

**Domain Events**:
- `ParticipantRemovedFromBudgetEvent`

---

### ❌ UC006: Definir Permissões
**Status**: Não Implementado

**Descrição**: Define permissões específicas para participantes do orçamento.

**Ator**: Usuário administrador do orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário é administrador do orçamento
- Participante existe no orçamento

**Fluxo Principal**:
1. Administrador acessa gestão de participantes
2. Seleciona participante
3. Clica em "Definir Permissões"
4. Configura permissões específicas
5. Confirma alterações
6. Sistema valida permissões
7. Sistema atualiza permissões
8. Sistema notifica participante

**Critérios de Aceitação**:
- ❌ Permissões incluem: visualizar, editar, administrar
- ❌ Administrador sempre tem todas as permissões
- ❌ Mudanças são aplicadas imediatamente

**Domain Events**:
- `ParticipantPermissionsUpdatedEvent`

---

### ✅ UC007: Excluir Orçamento
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
6. Sistema valida permissões
7. Sistema remove orçamento
8. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Apenas proprietário pode excluir
- ✅ Não pode excluir orçamento com contas ativas
- ✅ Não pode excluir orçamento com transações
- ✅ Exclusão é permanente

**Domain Events**:
- `BudgetDeletedEvent`

---

## 🏦 **Gestão de Contas**

### ✅ UC008: Criar Conta
**Status**: Implementado  
**Arquivo**: [`CreateAccountUseCase.ts`](../src/application/use-cases/account/create-account/CreateAccountUseCase.ts)

**Descrição**: Permite ao usuário criar uma nova conta bancária ou financeira.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `AccountCreatedEvent`

---

### ✅ UC009: Editar Conta
**Status**: Implementado  
**Arquivo**: [`UpdateAccountUseCase.ts`](../src/application/use-cases/account/update-account/UpdateAccountUseCase.ts)

**Descrição**: Permite ao usuário editar dados de uma conta existente.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `AccountUpdatedEvent`

---

### ✅ UC010: Excluir Conta
**Status**: Implementado  
**Arquivo**: [`DeleteAccountUseCase.ts`](../src/application/use-cases/account/delete-account/DeleteAccountUseCase.ts)

**Descrição**: Permite ao usuário excluir uma conta financeira.

**Ator**: Usuário com permissão no orçamento

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
5. Sistema valida permissões
6. Sistema marca conta como excluída
7. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Não pode excluir conta com saldo diferente de zero
- ✅ Não pode excluir conta com transações ativas
- ✅ Exclusão é lógica (soft delete)

**Domain Events**:
- `AccountDeletedEvent`

---

### ✅ UC011: Transferir entre Contas
**Status**: Implementado  
**Arquivo**: [`TransferBetweenAccountsUseCase.ts`](../src/application/use-cases/account/transfer-between-accounts/TransferBetweenAccountsUseCase.ts)

**Descrição**: Permite transferir valores entre contas do mesmo orçamento.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `TransferBetweenAccountsExecutedEvent`

---

### ✅ UC012: Reconciliar Saldo
**Status**: Implementado
**Arquivo**: [`ReconcileAccountUseCase.ts`](../src/application/use-cases/account/reconcile-account/ReconcileAccountUseCase.ts)

**Descrição**: Permite ajustar o saldo da conta baseado no extrato bancário real.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `AccountReconciledEvent`

---

## 💸 **Gestão de Transações**

### ✅ UC013: Lançar Receita
**Status**: Implementado (via CreateTransactionUseCase)  
**Arquivo**: [`CreateTransactionUseCase.ts`](../src/application/use-cases/transaction/create-transaction/CreateTransactionUseCase.ts)

**Descrição**: Permite ao usuário registrar uma receita (entrada de dinheiro).

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `TransactionCreatedEvent`

---

### ✅ UC014: Lançar Despesa
**Status**: Implementado (via CreateTransactionUseCase)  
**Arquivo**: [`CreateTransactionUseCase.ts`](../src/application/use-cases/transaction/create-transaction/CreateTransactionUseCase.ts)

**Descrição**: Permite ao usuário registrar uma despesa (saída de dinheiro).

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `TransactionCreatedEvent`

---

### ❌ UC015: Agendar Transação Futura
**Status**: Não Implementado

**Descrição**: Permite agendar uma transação para ser executada em data futura.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta existe
- Categoria existe

**Fluxo Principal**:
1. Usuário acessa agendamento
2. Preenche dados da transação
3. Define data futura de execução
4. Configura recorrência (opcional)
5. Confirma agendamento
6. Sistema valida dados
7. Sistema cria transação agendada
8. Sistema programa execução
9. Sistema exibe confirmação

**Critérios de Aceitação**:
- ❌ Data deve ser futura
- ❌ Recorrência pode ser diária, semanal, mensal
- ❌ Sistema executa automaticamente na data

**Domain Events**:
- `TransactionScheduledEvent`

---

### ❌ UC016: Registrar Transação Passada
**Status**: Não Implementado

**Descrição**: Permite registrar uma transação que ocorreu no passado.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário tem acesso ao orçamento
- Conta existe
- Categoria existe

**Fluxo Principal**:
1. Usuário acessa lançamento retroativo
2. Preenche dados da transação
3. Define data passada
4. Justifica lançamento retroativo
5. Confirma registro
6. Sistema valida dados
7. Sistema cria transação
8. Sistema atualiza histórico
9. Sistema exibe confirmação

**Critérios de Aceitação**:
- ❌ Data deve ser passada
- ❌ Justificativa é obrigatória
- ❌ Relatórios refletem a data real

**Domain Events**:
- `TransactionRegisteredRetroactivelyEvent`

---

### ❌ UC017: Marcar Transação como Realizada
**Status**: Não Implementado

**Descrição**: Marca uma transação agendada como executada/realizada.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Transação está agendada
- Data de execução chegou ou passou

**Fluxo Principal**:
1. Sistema lista transações pendentes
2. Usuário seleciona transação
3. Clica em "Marcar como Realizada"
4. Confirma execução
5. Sistema valida permissões
6. Sistema executa transação
7. Sistema atualiza status
8. Sistema exibe confirmação

**Critérios de Aceitação**:
- ❌ Apenas transações agendadas podem ser marcadas
- ❌ Saldo é atualizado na marcação
- ❌ Data de execução é registrada

**Domain Events**:
- `ScheduledTransactionExecutedEvent`

---

### ❌ UC018: Marcar Transação como Atrasada
**Status**: Não Implementado

**Descrição**: Sistema marca automaticamente transações como atrasadas.

**Ator**: Sistema automático

**Precondições**:
- Transação está agendada
- Data de execução passou
- Transação não foi executada

**Fluxo Principal**:
1. Sistema executa verificação diária
2. Identifica transações vencidas
3. Marca como atrasadas
4. Registra no histórico
5. Notifica usuário
6. Atualiza dashboards

**Critérios de Aceitação**:
- ❌ Verificação automática diária
- ❌ Notificação ao usuário responsável
- ❌ Status visível nos relatórios

**Domain Events**:
- `TransactionMarkedAsLateEvent`

---

### ✅ UC019: Cancelar Transação Agendada
**Status**: Implementado
**Arquivo**: [`CancelScheduledTransactionUseCase.ts`](../src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase.ts)

**Descrição**: Permite cancelar uma transação que foi agendada para o futuro.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Transação está agendada
- Transação ainda não foi executada

**Fluxo Principal**:
1. Usuário acessa transações agendadas
2. Seleciona transação a cancelar
3. Clica em "Cancelar"
4. Confirma cancelamento
5. Sistema valida permissões
6. Sistema cancela agendamento
7. Sistema registra cancelamento
8. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Apenas transações não executadas podem ser canceladas
- ✅ Motivo do cancelamento é registrado
- ✅ Histórico preserva o cancelamento

**Domain Events**:
- `ScheduledTransactionCancelledEvent`

---

### ✅ UC020: Editar Transação
**Status**: Implementado  
**Arquivo**: [`UpdateTransactionUseCase.ts`](../src/application/use-cases/transaction/update-transaction/UpdateTransactionUseCase.ts)

**Descrição**: Permite editar dados de uma transação existente.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Transação existe
- Usuário tem permissão para editar

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

**Domain Events**:
- `TransactionUpdatedEvent`

---

### ✅ UC021: Excluir Transação
**Status**: Implementado  
**Arquivo**: [`DeleteTransactionUseCase.ts`](../src/application/use-cases/transaction/delete-transaction/DeleteTransactionUseCase.ts)

**Descrição**: Permite excluir uma transação existente.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Transação existe
- Usuário tem permissão para excluir

**Fluxo Principal**:
1. Usuário seleciona transação
2. Clica em "Excluir"
3. Confirma exclusão
4. Sistema valida permissões
5. Sistema remove transação
6. Sistema ajusta saldos
7. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Saldos são recalculados automaticamente
- ✅ Exclusão é registrada no histórico
- ✅ Operação é reversível por período limitado

**Domain Events**:
- `TransactionDeletedEvent`

---

## 📂 **Gestão de Categorias**

### ✅ UC022: Criar Categoria
**Status**: Implementado  
**Arquivo**: [`CreateCategoryUseCase.ts`](../src/application/use-cases/category/create-category/CreateCategoryUseCase.ts)

**Descrição**: Permite ao usuário criar uma nova categoria para classificar transações.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `CategoryCreatedEvent`

---

### ✅ UC023: Editar Categoria
**Status**: Implementado  
**Arquivo**: [`UpdateCategoryUseCase.ts`](../src/application/use-cases/category/update-category/UpdateCategoryUseCase.ts)

**Descrição**: Permite editar dados de uma categoria existente.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Categoria existe no orçamento
- Usuário tem permissão para editar

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

**Domain Events**:
- `CategoryUpdatedEvent`

---

### ✅ UC024: Excluir Categoria
**Status**: Implementado  
**Arquivo**: [`DeleteCategoryUseCase.ts`](../src/application/use-cases/category/delete-category/DeleteCategoryUseCase.ts)

**Descrição**: Permite excluir uma categoria que não está sendo utilizada.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Categoria existe no orçamento
- Categoria não possui transações associadas
- Usuário tem permissão para excluir

**Fluxo Principal**:
1. Usuário seleciona categoria
2. Clica em "Excluir"
3. Sistema verifica dependências
4. Usuário confirma exclusão
5. Sistema valida permissões
6. Sistema remove categoria
7. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Não pode excluir categoria com transações
- ✅ Sistema sugere migração de transações
- ✅ Exclusão é registrada no histórico

**Domain Events**:
- `CategoryDeletedEvent`

---

### ❌ UC025: Personalizar Categorias por Orçamento
**Status**: Não Implementado

**Descrição**: Permite customizar categorias específicas para cada orçamento.

**Ator**: Usuário administrador do orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário é administrador do orçamento

**Fluxo Principal**:
1. Usuário acessa configurações do orçamento
2. Seleciona "Personalizar Categorias"
3. Escolhe categorias padrão a incluir
4. Cria categorias específicas
5. Define ordem de exibição
6. Confirma configuração
7. Sistema aplica personalização
8. Sistema exibe confirmação

**Critérios de Aceitação**:
- ❌ Categorias padrão ficam disponíveis
- ❌ Categorias específicas só aparecem no orçamento
- ❌ Configuração é por orçamento

**Domain Events**:
- `BudgetCategoriesCustomizedEvent`

---

## 💳 **Gestão de Cartões de Crédito**

### ✅ UC026: Cadastrar Cartão de Crédito
**Status**: Implementado  
**Arquivo**: [`CreateCreditCardUseCase.ts`](../src/application/use-cases/credit-card/create-credit-card/CreateCreditCardUseCase.ts)

**Descrição**: Permite cadastrar um novo cartão de crédito para controle de gastos.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `CreditCardCreatedEvent`

---

### ✅ UC027: Editar Cartão de Crédito
**Status**: Implementado  
**Arquivo**: [`UpdateCreditCardUseCase.ts`](../src/application/use-cases/credit-card/update-credit-card/UpdateCreditCardUseCase.ts)

**Descrição**: Permite editar dados de um cartão de crédito existente.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Cartão existe no orçamento
- Usuário tem permissão para editar

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

**Domain Events**:
- `CreditCardUpdatedEvent`

---

### ✅ UC027: Excluir Cartão de Crédito
**Status**: Implementado  
**Arquivo**: [`DeleteCreditCardUseCase.ts`](../src/application/use-cases/credit-card/delete-credit-card/DeleteCreditCardUseCase.ts)

**Descrição**: Permite excluir um cartão de crédito que não possui faturas pendentes.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Cartão existe no orçamento
- Cartão não possui faturas em aberto
- Usuário tem permissão para excluir

**Fluxo Principal**:
1. Usuário seleciona cartão
2. Clica em "Excluir"
3. Sistema verifica dependências
4. Usuário confirma exclusão
5. Sistema valida permissões
6. Sistema remove cartão
7. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Não pode excluir cartão com faturas abertas
- ✅ Histórico de transações é preservado
- ✅ Exclusão é registrada

**Domain Events**:
- `CreditCardDeletedEvent`

---

### ✅ UC028: Criar Fatura do Cartão
**Status**: Implementado  
**Arquivo**: [`CreateCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/create-credit-card-bill/CreateCreditCardBillUseCase.ts)

**Descrição**: Cria uma nova fatura para o cartão de crédito com base nas transações do período.

**Ator**: Sistema automático ou Usuário com permissão no orçamento

**Precondições**:
- Cartão existe no orçamento
- Período da fatura está definido
- Usuário tem permissão no orçamento

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

**Domain Events**:
- `CreditCardBillCreatedEvent`

---

### ✅ UC029: Atualizar Fatura do Cartão
**Status**: Implementado  
**Arquivo**: [`UpdateCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/update-credit-card-bill/UpdateCreditCardBillUseCase.ts)

**Descrição**: Atualiza dados de uma fatura do cartão de crédito existente.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Fatura existe no sistema
- Usuário tem permissão no orçamento
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

**Domain Events**:
- `CreditCardBillUpdatedEvent`

---

### ✅ UC030: Excluir Fatura do Cartão
**Status**: Implementado  
**Arquivo**: [`DeleteCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/delete-credit-card-bill/DeleteCreditCardBillUseCase.ts)

**Descrição**: Exclui uma fatura do cartão de crédito que ainda não foi paga.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Fatura existe no sistema
- Fatura não está paga
- Usuário tem permissão no orçamento

**Fluxo Principal**:
1. Usuário seleciona fatura
2. Clica em "Excluir Fatura"
3. Sistema verifica status
4. Usuário confirma exclusão
5. Sistema valida permissões
6. Sistema remove fatura
7. Sistema libera transações associadas
8. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Apenas faturas não pagas podem ser excluídas
- ✅ Transações associadas são liberadas
- ✅ Exclusão é registrada no histórico

**Domain Events**:
- `CreditCardBillDeletedEvent`

---

### ❌ UC031: Marcar Fatura como Paga
**Status**: Não Implementado

**Descrição**: Marca uma fatura do cartão como paga e registra o pagamento.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Fatura existe e está em aberto
- Usuário tem permissão

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
- ❌ Valor do pagamento deve ser informado
- ❌ Data do pagamento é registrada
- ❌ Saldo da conta é debitado

**Domain Events**:
- `CreditCardBillPaidEvent`

---

### ✅ UC032: Reabrir Fatura
**Status**: Implementado
**Arquivo**: [`ReopenCreditCardBillUseCase.ts`](../src/application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase.ts)

**Descrição**: Reabre uma fatura que foi marcada como paga por engano.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Fatura está marcada como paga
- Reabrir é permitido (prazo)

**Fluxo Principal**:
1. Usuário acessa histórico de faturas
2. Seleciona fatura paga
3. Clica em "Reabrir"
4. Confirma reabertura
5. Sistema valida permissões
6. Sistema reverte pagamento
7. Sistema atualiza status
8. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Apenas faturas recentes podem ser reabertas
- ✅ Transação de pagamento é estornada
- ✅ Justificativa é obrigatória

**Domain Events**:
- `CreditCardBillReopenedEvent`

---

### ❌ UC033: Controlar Limite do Cartão
**Status**: Não Implementado

**Descrição**: Monitora e controla o uso do limite do cartão de crédito.

**Ator**: Sistema automático + Usuário

**Precondições**:
- Cartão está cadastrado
- Transações estão sendo registradas

**Fluxo Principal**:
1. Sistema monitora transações
2. Calcula limite utilizado
3. Verifica percentual de uso
4. Alerta quando próximo do limite
5. Bloqueia se necessário
6. Notifica usuário

**Critérios de Aceitação**:
- ❌ Alertas em 80% e 95% do limite
- ❌ Usuário pode configurar alertas
- ❌ Histórico de uso é mantido

**Domain Events**:
- `CreditCardLimitWarningEvent`
- `CreditCardLimitExceededEvent`

---

## 🎯 **Gestão de Metas**

### ✅ UC034: Criar Meta
**Status**: Implementado  
**Arquivo**: [`CreateGoalUseCase.ts`](../src/application/use-cases/goal/create-goal/CreateGoalUseCase.ts)

**Descrição**: Permite criar uma meta financeira com valor objetivo e prazo.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `GoalCreatedEvent`

---

### ✅ UC035: Editar Meta
**Status**: Implementado  
**Arquivo**: [`UpdateGoalUseCase.ts`](../src/application/use-cases/goal/update-goal/UpdateGoalUseCase.ts)

**Descrição**: Permite editar dados de uma meta existente.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Meta existe no orçamento
- Usuário tem permissão para editar

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

**Domain Events**:
- `GoalUpdatedEvent`

---

### ✅ UC036: Excluir Meta
**Status**: Implementado  
**Arquivo**: [`DeleteGoalUseCase.ts`](../src/application/use-cases/goal/delete-goal/DeleteGoalUseCase.ts)

**Descrição**: Permite excluir uma meta financeira.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Meta existe no orçamento
- Usuário tem permissão para excluir

**Fluxo Principal**:
1. Usuário seleciona meta
2. Clica em "Excluir"
3. Confirma exclusão
4. Sistema valida permissões
5. Sistema remove meta
6. Sistema preserva histórico de aportes
7. Sistema exibe confirmação

**Critérios de Aceitação**:
- ✅ Histórico de aportes é preservado
- ✅ Exclusão é registrada no histórico
- ✅ Aportes podem ser transferidos para conta

**Domain Events**:
- `GoalDeletedEvent`

---

### ✅ UC037: Fazer Aporte Manual
**Status**: Implementado  
**Arquivo**: [`AddAmountToGoalUseCase.ts`](../src/application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase.ts)

**Descrição**: Permite fazer um aporte manual para uma meta específica.

**Ator**: Usuário com permissão no orçamento

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

**Domain Events**:
- `ManualContributionAddedToGoalEvent`

---

### ❌ UC038: Configurar Aporte Automático
**Status**: Não Implementado

**Descrição**: Configura aportes automáticos recorrentes para uma meta.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Meta existe e está ativa
- Conta origem está definida

**Fluxo Principal**:
1. Usuário seleciona meta
2. Clica em "Configurar Aporte Automático"
3. Define valor do aporte recorrente
4. Seleciona frequência (mensal, quinzenal, etc.)
5. Define data do primeiro aporte
6. Confirma configuração
7. Sistema valida dados
8. Sistema programa aportes automáticos
9. Sistema exibe confirmação

**Critérios de Aceitação**:
- ❌ Frequência pode ser configurável
- ❌ Sistema executa automaticamente
- ❌ Usuário é notificado de cada aporte

**Domain Events**:
- `AutomaticContributionConfiguredEvent`

---

## 💰 **Sistema de Envelopes**

### ❌ UC039: Criar Envelope
**Status**: Não Implementado

**Descrição**: Cria um envelope para alocação de valores por categoria.

**Ator**: Usuário com permissão no orçamento

**Precondições**:
- Usuário logado no sistema
- Usuário tem acesso ao orçamento

**Fluxo Principal**:
1. Usuário acessa sistema de envelopes
2. Clica em "Novo Envelope"
3. Preenche dados do envelope
4. Define valor mensal
5. Associa a categorias (opcional)
6. Confirma criação
7. Sistema valida dados
8. Sistema cria envelope
9. Sistema exibe confirmação

**Critérios de Aceitação**:
- ❌ Nome deve ser único no orçamento
- ❌ Valor mensal deve ser positivo
- ❌ Pode ser associado a múltiplas categorias

**Domain Events**:
- `EnvelopeCreatedEvent`

---

### ❌ UC040: Editar Envelope
**Status**: Não Implementado

**Descrição**: Edita configurações de um envelope existente.

**Domain Events**:
- `EnvelopeUpdatedEvent`

---

### ❌ UC041: Excluir Envelope
**Status**: Não Implementado

**Descrição**: Exclui um envelope que não possui saldo.

**Domain Events**:
- `EnvelopeDeletedEvent`

---

### ❌ UC042: Fazer Aporte no Envelope
**Status**: Não Implementado

**Descrição**: Adiciona valor a um envelope específico.

**Domain Events**:
- `EnvelopeContributionAddedEvent`

---

### ❌ UC043: Retirar Valor do Envelope
**Status**: Não Implementado

**Descrição**: Retira valor de um envelope para uso.

**Domain Events**:
- `EnvelopeWithdrawalEvent`

---

### ❌ UC044: Transferir Entre Envelopes
**Status**: Não Implementado

**Descrição**: Transfere valor entre diferentes envelopes.

**Domain Events**:
- `EnvelopeTransferEvent`

---

### ❌ UC045: Configurar Envelope Automático
**Status**: Não Implementado

**Descrição**: Configura aporte automático mensal para envelope.

**Domain Events**:
- `AutomaticEnvelopeConfiguredEvent`

---

## 🔔 **Alertas e Notificações**

### ❌ UC046: Configurar Alerta de Orçamento
**Status**: Não Implementado

**Descrição**: Configura alertas quando gastos se aproximam do limite.

**Domain Events**:
- `BudgetAlertConfiguredEvent`

---

### ❌ UC047: Configurar Alerta de Meta
**Status**: Não Implementado

**Descrição**: Configura alertas relacionados ao progresso das metas.

**Domain Events**:
- `GoalAlertConfiguredEvent`

---

### ❌ UC048: Configurar Lembrete de Vencimento
**Status**: Não Implementado

**Descrição**: Configura lembretes para datas de vencimento.

**Domain Events**:
- `DueDateReminderConfiguredEvent`

---

### ❌ UC049: Receber Notificação de Limite
**Status**: Não Implementado

**Descrição**: Recebe notificação quando limites são atingidos.

**Domain Events**:
- `LimitNotificationSentEvent`

---

### ❌ UC050: Receber Alerta de Oportunidade
**Status**: Não Implementado

**Descrição**: Recebe alertas sobre oportunidades de economia.

**Domain Events**:
- `OpportunityAlertSentEvent`

---

### ❌ UC051: Personalizar Canais de Notificação
**Status**: Não Implementado

**Descrição**: Configura como e onde receber notificações.

**Domain Events**:
- `NotificationChannelsConfiguredEvent`

---

### ❌ UC052: Configurar Frequência de Alertas
**Status**: Não Implementado

**Descrição**: Define com que frequência receber cada tipo de alerta.

**Domain Events**:
- `AlertFrequencyConfiguredEvent`

---

## 📈 **Estatísticas Finais**

- **✅ Implementados**: 26 use cases (43%)
- **❌ Não Implementados**: 34 use cases (57%)

### **Priorização Sugerida para Próximas Implementações**:

1. **Alta Prioridade** (Core Business):
   - UC015: Agendar Transação Futura
   - UC038: Configurar Aporte Automático
   - UC031: Marcar Fatura como Paga

2. **Média Prioridade** (Features Importantes):
   - UC025: Personalizar Categorias por Orçamento
   - UC032-033: Funcionalidades restantes de Cartões
   - UC012: Reconciliar Saldo

3. **Baixa Prioridade** (Features Avançadas):
   - Sistema de Envelopes (UC039-045)
   - Alertas e Notificações (UC046-052)

**Observação**: Use cases de visualização, relatórios e dashboards serão tratados separadamente em camadas específicas de apresentação e não fazem parte desta documentação focada em mutação de dados.

---

**Este documento será atualizado conforme novas features são implementadas ou modificadas.**
