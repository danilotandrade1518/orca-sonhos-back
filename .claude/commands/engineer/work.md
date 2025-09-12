# Engineer Work

Estamos atualmente trabalhando em uma funcionalidade que está especificada na seguinte pasta:

<folder>
#$ARGUMENTS
</folder>

Para trabalhar nisso, você deve:

1 - Mover o Card do Jira para "Em Progresso"
2 - Ler todos os arquivos markdown na pasta
3 - Revisar o arquivo plan.md e identificar qual Fase está atualmente em progresso
4 - Apresentar ao usuário um plano para abordar a próxima fase
5 - Se não estivermos em uma feature branch, peça permissão para criar uma. Se estivermos em uma feature branch que corresponde ao nome da funcionalidade, estamos prontos.

Importante:

## Não manter comentários ou instruções no código

- O código final não deve conter comentários ou instruções
- Remova qualquer comentário ou instrução antes de finalizar o código
- O código deve ser limpo e pronto para produção
- O código deve ser legível e seguir as melhores práticas
- O código deve seguir regras de linting e formatação apropriadas conforme configurações do projeto

## Code review

## Prioridades de Revisão (em ordem)

1. **Correção** - O código realmente funciona para o caso de uso pretendido?
2. **Segurança** - Há bugs óbvios, problemas de segurança ou padrões propensos a erro?
3. **Clareza** - O código é legível e manutenível?
4. **Adequação** - O nível de complexidade está certo para o problema?

## Processo de Revisão

### 1. Análise Funcional

- **Resolve o requisito declarado?** Verifique contra o problema original
- **Casos extremos**: Cenários óbvios de falha são tratados adequadamente?
- **Integração**: Isso funcionará com o sistema/ambiente mais amplo?

### 2. Avaliação da Qualidade do Código

- **Legibilidade**: Alguém mais pode entender isso em 6 meses?
- **Tratamento de erro**: Falhas prováveis são capturadas e tratadas adequadamente?
- **Gerenciamento de recursos**: Limpeza adequada de arquivo/conexão, uso de memória
- **Sinais vermelhos de performance**: Ineficiências óbvias (consultas N+1, loops desnecessários)

### 3. Verificação de Manutenibilidade

- **Dependências**: Novas dependências são justificadas e bem escolhidas?
- **Acoplamento**: O código é adequadamente modular?
- **Documentação**: Partes não-óbvias são explicadas?

## O que Sinalizar

### Problemas de Alta Prioridade (Sempre mencionar)

- ❗ **Bugs de correção** - Código que não funcionará como esperado
- ❗ **Vulnerabilidades de segurança** - SQL injection, XSS, segredos expostos
- ❗ **Vazamentos de recursos** - Arquivos não fechados, conexões, problemas de memória
- ❗ **Breaking changes** - Mudanças que quebram funcionalidade existente

### Problemas de Prioridade Média (Mencionar se significativo)

- ⚠️ **Lacunas de tratamento de erro** - Tratamento de exceção ausente para falhas prováveis
- ⚠️ **Preocupações de performance** - Ineficiências óbvias que impactariam usuários
- ⚠️ **Problemas de legibilidade** - Nomes de variáveis confusos, lógica complexa sem comentários
- ⚠️ **Over-engineering** - Complexidade desnecessária para o problema dado

### Prioridade Baixa (Mencionar apenas se flagrante)

- 💡 **Inconsistências de estilo** - Violações menores do PEP 8
- 💡 **Micro-otimizações** - Pequenas melhorias de performance
- 💡 **Melhorias teóricas** - Padrões perfeitos que não agregam valor real

## Formato de Revisão

### Estrutura Padrão de Revisão

```
## Resumo da Revisão de Código

**Avaliação Geral**: [Julgamento geral breve]

### ✅ O que Funciona Bem
- [Observações positivas específicas]
- [Bons padrões ou abordagens usadas]

### ❗ Problemas Críticos (se houver)
- [Itens que devem ser corrigidos com explicação]

### ⚠️ Sugestões de Melhoria
- [Recomendações acionáveis com justificativa]

### 💡 Melhorias Opcionais (se houver)
- [Melhorias que seria bom ter]

**Recomendação**: [Pronto para usar / Precisa de correções / Revisão maior necessária]
```

## Diretrizes de Revisão

### Seja Construtivo

- Explique POR QUE algo é um problema, não apenas O QUE está errado
- Sugira alternativas específicas ao criticar
- Reconheça bons padrões e decisões
- Enquadre feedback como melhoria colaborativa

### Seja Prático

- Foque no impacto do mundo real, não na perfeição teórica
- Considere o contexto e complexidade do requisito original
- Não sugira mudanças arquiteturais maiores a menos que haja um problema sério

### Seja Específico

- Aponte para linhas ou padrões exatos quando possível
- Dê exemplos concretos de melhorias
- Explique o impacto potencial dos problemas

## Cenários Comuns de Revisão

### Quando Código é Over-Engineered

```
"A implementação funciona corretamente, mas parece mais complexa do que necessário para este requisito. Considere simplificar [área específica] pois [justificativa]."
```

### Quando Código Tem Bugs

```
"Encontrei um problema potencial em [localização]: [descrição]. Isso poderia causar [impacto] quando [cenário]. Correção sugerida: [solução específica]."
```

### Quando Código é Bom

```
"Implementação limpa que resolve bem o requisito. Bom uso de [padrão específico] e tratamento de erro apropriado."
```

## Estilo de Comunicação

- Comece com o que funciona bem
- Seja direto sobre problemas reais mas respeitoso no tom
- Forneça contexto para suas recomendações
- Distinga entre deve-corrigir e seria-bom-ter
- Se o código é bom, diga isso claramente

## Sinais Vermelhos a Evitar em suas Revisões

- ❌ Implicar com questões de estilo quando a funcionalidade está correta
- ❌ Sugerir padrões complexos para problemas simples
- ❌ Ser excessivamente crítico sem oferecer soluções
- ❌ Focar em melhores práticas teóricas sobre preocupações práticas
- ❌ Perder bugs funcionais óbvios enquanto comenta sobre estilo

Lembre-se: Seu objetivo é ajudar a entregar código funcional e manutenível, não alcançar perfeição teórica.

## Testes

## Princípios Fundamentais

1. **Teste o código como está** - Nunca modifique implementação para se adequar aos testes
2. **Teste comportamento, não implementação** - Foque no que o código deveria fazer, não em como faz
3. **Encontre problemas reais** - Escreva testes que exponham problemas reais
4. **Sinalize lacunas, não as corrija** - Relate problemas ao agente principal para resolução adequada

## Abordagem de Teste

### 1. Entenda o que Está Testando

- **Leia o requisito original** - O que este código deveria fazer?
- **Analise a implementação** - O que ele realmente faz?
- **Identifique a interface pública** - Quais funções/métodos devem ser testados?

### 2. Categorias de Teste (em ordem de prioridade)

#### **Testes de Caminho Feliz** (Sempre incluir)

- Teste o caso de uso principal com entradas típicas
- Verifique saídas esperadas para cenários normais
- Garanta que funcionalidade central funciona

#### **Testes de Casos Extremos** (Incluir quando relevante)

- Condições de limite (entradas vazias, valores máximos, etc.)
- Casos extremos comuns específicos do domínio do problema
- Entradas Null/None onde aplicável

#### **Testes de Condição de Erro** (Incluir se tratamento de erro existe)

- Entradas inválidas que deveriam gerar exceções
- Teste que exceções apropriadas são geradas
- Verifique se mensagens de erro são úteis

### 3. Estrutura de Teste

#### Use Nomes de Teste Claros

## O que Testar vs. O que Sinalizar

### ✅ Escrever Testes Para

- **Funções e métodos públicos** - A interface real
- **Tipos de entrada diferentes** - Vários cenários válidos
- **Condições de erro esperadas** - Onde exceções devem ser geradas
- **Pontos de integração** - Se o código chama serviços/APIs externos

### 🚩 Sinalizar para Agente Principal (Não Contornar com Testes)

- **Tratamento de erro ausente** - Código que deveria validar entradas mas não faz
- **Tipos de retorno não claros** - Funções que às vezes retornam tipos diferentes
- **Valores hard-coded** - Números ou strings mágicos que deveriam ser configuráveis
- **Código não testável** - Funções muito complexas para testar efetivamente
- **Funcionalidade ausente** - Requisitos não implementados

## Lembre-se

- Seu trabalho é verificar se o código funciona, não fazê-lo funcionar
- Bons testes servem como documentação de comportamento esperado
- Falhas de teste são informação valiosa, não problemas para contornar
- Sinalize problemas de implementação claramente para que o agente principal possa abordá-los adequadamente

Toda vez que completar uma fase do plano:

- Pause e peça ao usuário para validar seu código.
- Faça as mudanças necessárias até ser aprovado
- Atualize a fase correspondente no arquivo plan.md marcando o que foi feito e adicionando comentários úteis para o desenvolvedor que abordará as próximas fases, especialmente sobre questões, decisões, etc.
- Apenas inicie a próxima fase após o usuário concordar que você deve começar. Quando iniciar a próxima fase, atualize o arquivo plan.md marcando a nova fase como em progresso.

Agora, veja a fase atual de desenvolvimento e forneça um plano ao usuário sobre como abordá-la.
