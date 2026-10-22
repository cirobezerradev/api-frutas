# construcao-api

## Executar

Instale as dependências do projeto e inicie a API na raiz do repositório:

```bash
uvicorn app:app --reload
```

Abra [http://127.0.0.1:8000](http://127.0.0.1:8000) para usar o painel web.
A interface consome a API no mesmo endereço; a documentação interativa fica
disponível em [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

O painel permite listar, filtrar, criar, editar e remover produtos em cards.
Cada produto tem nome, características, cor e um link opcional para sua foto.
A lista é mantida em memória pela API e volta aos dados iniciais quando o
servidor reinicia.

### Atualizar um produto

Envie `PUT /produtos/{id}` com os campos do produto:

```json
{
  "nome": "kiwi",
  "descricao": "Fruta refrescante e rica em vitamina C.",
  "cor": "#718355",
  "imagem_url": "https://exemplo.com/kiwi.jpg"
}
```

`descricao` e `imagem_url` podem ser `null`. A cor deve estar no formato
hexadecimal `#RRGGBB`, e o link da foto deve ser uma URL HTTP ou HTTPS válida.
Os produtos continuam guardados em memória e não são preservados após reiniciar
o servidor.