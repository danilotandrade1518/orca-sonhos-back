# UC019 - Cancelar Transação Agendada

- [x] Criar value object `CancellationReason`
- [x] Implementar erros `TransactionNotScheduledError`, `TransactionAlreadyExecutedError`, `InvalidCancellationReasonError`
- [x] Atualizar método `Transaction.cancel()` para aceitar motivo e regras
- [x] Criar `ScheduledTransactionCancelledEvent`
- [x] Implementar caso de uso `CancelScheduledTransactionUseCase`
- [x] Testes unitários para value object
- [x] Testes unitários para Transaction.cancel
- [x] Testes do caso de uso cobrindo cenários de erro
- [x] Cobertura mínima 90%
- [x] Documentar feature em `docs/features.md`
