from pathlib import Path as FilePath
from typing import Annotated

from fastapi import FastAPI, HTTPException, Path, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl, StringConstraints

app = FastAPI()
static_directory = FilePath(__file__).parent / 'static'
app.mount('/static', StaticFiles(directory=static_directory), name='static')


class Produto(BaseModel):
    id: int
    nome: str
    descricao: str | None = None
    cor: str = '#718355'
    imagem_url: HttpUrl | None = None


class ProdutoCreate(BaseModel):
    nome: Annotated[
        str,
        StringConstraints(min_length=1, max_length=100, strip_whitespace=True),
    ]
    descricao: str | None = None
    cor: Annotated[str, StringConstraints(pattern=r'^#[0-9a-fA-F]{6}$')] = '#718355'
    imagem_url: HttpUrl | None = None


class ProdutoUpdate(ProdutoCreate):
    pass


produtos: dict[int, Produto] = {
    1: Produto(id=1, nome='abacate', descricao='Fruta cremosa e rica em nutrientes.', cor='#79945b'),
    2: Produto(id=2, nome='abacaxi', descricao='Fruta tropical de sabor marcante.', cor='#e4b94f'),
    3: Produto(id=3, nome='kiwi', descricao='Pequeno, refrescante e cheio de sabor.', cor='#6e9b69'),
    4: Produto(id=4, nome='melancia', descricao='Refrescante e perfeita para os dias quentes.', cor='#d97972'),
    5: Produto(id=5, nome='banana', descricao='Prática, doce e cheia de energia.', cor='#e7c75b'),
}

@app.get('/')
def inicio():
    return FileResponse(static_directory / 'index.html')

@app.get('/produtos', response_model=list[Produto])
def ver_produtos():
    return list(produtos.values())

@app.get('/produtos/{produto_id}', response_model=Produto)
def buscar_produto(produto_id: int = Path(gt=0)):
    try:
        return produtos[produto_id]
    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f'Produto com ID {produto_id} não encontrado.',
        ) from exc


@app.put('/produtos/{produto_id}', response_model=Produto)
def atualizar_produto(
    produto: ProdutoUpdate,
    produto_id: int = Path(gt=0),
):
    if produto_id not in produtos:
        raise HTTPException(
            status_code=404,
            detail=f'Produto com ID {produto_id} não encontrado.',
        )

    produto_atualizado = Produto(id=produto_id, **produto.model_dump())
    produtos[produto_id] = produto_atualizado
    return produto_atualizado


@app.delete('/produtos/{produto_id}', response_model=Produto)
def deletar_produto(produto_id: int = Path(gt=0)):
    try:
        return produtos.pop(produto_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f'Produto com ID {produto_id} não encontrado.',
        ) from exc

@app.post(
    '/produtos',
    response_model=Produto,
    status_code=status.HTTP_201_CREATED,
)
def adicionar_produto(produto: ProdutoCreate):
    produto_id = max(produtos, default=0) + 1
    novo_produto = Produto(id=produto_id, **produto.model_dump())
    produtos[produto_id] = novo_produto
    return novo_produto
