# ADR 0001: Definição da Stack de Backend Inicial

## 1. Contexto

Precisamos definir a stack tecnológica do backend para garantir escalabilidade, produtividade e facilidade de manutenção no início do projeto OrçaSonhos.

## 2. Alternativas Consideradas

- Linguagem: Java
- Banco de Dados: MongoDB e Postgres
- Arquitetura: MVC, Hexagonal

## 3. Decisão Tomada

Utilizar Node.js com Express, TypeScript, Clean Architecture e MySQL, sem ORM inicialmente.

## 4. Razões para a Escolha

A equipe possui familiaridade com as tecnologias escolhidas, além de ser uma stack mais enxuta, sem a inclusão de ferramentas que ainda não sabemos se serão necessárias. O fato de serem tecnologias populares também foi considerado, facilitando o suporte e a contratação de novos membros.

## 5. Consequências

A stack escolhida é simples e muito utilizada na comunidade, o que facilita encontrar suporte. Não existe um risco específico vinculado às escolhas. Como impacto, destaca-se que a troca do banco de dados pode ser complexa no futuro, tornando essa uma escolha crítica.

## 6. Pontos de Atenção Futuros

Precisamos, no futuro, analisar onde e como iremos hospedar toda a stack citada.

## 7. Participantes

- Danilo Andrade, Arquiteto de Software
