const productList = document.querySelector("#product-list");
const productCount = document.querySelector("#product-count");
const searchInput = document.querySelector("#search-input");
const createForm = document.querySelector("#create-form");
const productName = document.querySelector("#product-name");
const productDescription = document.querySelector("#product-description");
const productImage = document.querySelector("#product-image");
const submitButton = document.querySelector("#submit-button");
const refreshButton = document.querySelector("#refresh-button");
const deleteDialog = document.querySelector("#delete-dialog");
const deleteMessage = document.querySelector("#delete-message");
const confirmDeleteButton = document.querySelector("#confirm-delete");
const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-form");
const editName = document.querySelector("#edit-name");
const editDescription = document.querySelector("#edit-description");
const editImage = document.querySelector("#edit-image");
const saveEditButton = document.querySelector("#save-edit");
const toastRegion = document.querySelector("#toast-region");

const fruitStyles = [
  { emoji: "🍊", color: "#fff2dc" },
  { emoji: "🍋", color: "#f7f5d9" },
  { emoji: "🥝", color: "#eaf3df" },
  { emoji: "🍉", color: "#ffebea" },
  { emoji: "🍌", color: "#fff5d8" },
  { emoji: "🍍", color: "#fff0d9" },
  { emoji: "🍇", color: "#f1eafb" },
  { emoji: "🍓", color: "#ffebed" },
  { emoji: "🥭", color: "#ffedde" },
  { emoji: "🍐", color: "#eef3df" },
];

let products = [];
let pendingDelete = null;
let pendingEdit = null;

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " error" : ""}`;
  toast.setAttribute("role", "status");

  const mark = document.createElement("span");
  mark.className = "toast-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = type === "error" ? "!" : "✓";
  toast.append(mark, document.createTextNode(message));
  toastRegion.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3600);
}

async function apiRequest(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Não foi possível conectar à API. Verifique sua conexão e tente novamente.");
  }

  if (!response.ok) {
    let message = `A API respondeu com erro (${response.status}).`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg) {
        message = body.detail[0].msg;
      }
    } catch {
      // Mantém a mensagem HTTP quando a resposta não contém JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const filtered = products.filter((product) => (
    product.nome.toLocaleLowerCase("pt-BR").includes(query)
    || String(product.id).includes(query)
  ));

  productCount.textContent = String(products.length);

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const emoji = document.createElement("span");
    emoji.className = "empty-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = products.length === 0 ? "🧺" : "🔎";
    const heading = document.createElement("strong");
    heading.textContent = products.length === 0 ? "Sua coleção está vazia" : "Nenhum resultado";
    const description = document.createElement("span");
    description.textContent = products.length === 0
      ? "Adicione seu primeiro produto para começar."
      : "Tente buscar usando outro nome ou ID.";
    empty.append(emoji, heading, description);
    productList.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach((product, index) => {
    const fruit = fruitStyles[(product.id - 1) % fruitStyles.length];
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${Math.min(index * 40, 240)}ms`;

    const photo = document.createElement("div");
    photo.className = "product-photo";
    const image = document.createElement("img");
    const fallbackImage = "/static/fruit-placeholder.svg";
    image.className = "product-photo-image";
    image.src = product.imagem_url || fallbackImage;
    image.alt = product.imagem_url
      ? `Foto de ${product.nome}`
      : `Imagem genérica de ${product.nome}`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      if (image.getAttribute("src") !== fallbackImage) {
        image.src = fallbackImage;
      } else {
        image.hidden = true;
      }
    });
    photo.append(image);

    const body = document.createElement("div");
    body.className = "product-card-body";
    const heading = document.createElement("div");
    heading.className = "product-card-heading";
    const name = document.createElement("p");
    name.className = "product-name";
    name.textContent = product.nome;
    const id = document.createElement("p");
    id.className = "product-id";
    id.textContent = `ID #${product.id}`;
    const identity = document.createElement("div");
    identity.append(name, id);
    heading.append(identity);

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.descricao || "Sem características informadas.";

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remover ${product.nome}`);
    remove.title = "Remover produto";
    remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"></path></svg>';
    remove.addEventListener("click", () => openDeleteDialog(product));

    const edit = document.createElement("button");
    edit.className = "edit-button";
    edit.type = "button";
    edit.setAttribute("aria-label", `Editar ${product.nome}`);
    edit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"></path></svg>Editar';
    edit.addEventListener("click", () => openEditDialog(product));

    const actions = document.createElement("div");
    actions.className = "product-card-actions";
    actions.append(edit, remove);
    body.append(heading, description, actions);
    card.append(photo, body);
    fragment.append(card);
  });
  productList.replaceChildren(fragment);
}

async function loadProducts() {
  productList.setAttribute("aria-busy", "true");
  const loader = document.createElement("div");
  loader.className = "loading-state";
  const spinner = document.createElement("span");
  spinner.className = "loader";
  spinner.setAttribute("aria-hidden", "true");
  loader.append(spinner, document.createTextNode("Carregando produtos..."));
  productList.replaceChildren(loader);

  try {
    products = await apiRequest("/produtos");
    renderProducts();
  } catch (error) {
    const state = document.createElement("div");
    state.className = "error-state";
    const heading = document.createElement("strong");
    heading.textContent = "Não foi possível carregar";
    const message = document.createElement("span");
    message.textContent = error.message;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Tentar novamente";
    retry.addEventListener("click", loadProducts);
    state.append(heading, message, retry);
    productList.replaceChildren(state);
    productCount.textContent = "—";
  } finally {
    productList.setAttribute("aria-busy", "false");
  }
}

function openDeleteDialog(product) {
  pendingDelete = product;
  deleteMessage.textContent = `“${product.nome}” será removido da sua coleção.`;
  deleteDialog.showModal();
}

function openEditDialog(product) {
  pendingEdit = product;
  editName.value = product.nome;
  editDescription.value = product.descricao || "";
  editImage.value = product.imagem_url || "";
  editDialog.showModal();
  editName.focus();
}

function productPayload(name, description, image) {
  return {
    nome: name.trim(),
    descricao: description.trim() || null,
    imagem_url: image.trim() || null,
  };
}

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nome = productName.value.trim();
  if (!nome) {
    productName.setCustomValidity("Informe um nome para o produto.");
    productName.reportValidity();
    return;
  }
  productName.setCustomValidity("");

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Adicionando...";
  try {
    const created = await apiRequest("/produtos", {
      method: "POST",
      body: JSON.stringify(productPayload(
        nome,
        productDescription.value,
        productImage.value,
      )),
    });
    productName.value = "";
    productDescription.value = "";
    productImage.value = "";
    searchInput.value = "";
    await loadProducts();
    showToast(`${created.nome} foi adicionado à coleção.`);
    productName.focus();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Adicionar produto";
  }
});

productName.addEventListener("input", () => {
  productName.setCustomValidity("");
});

searchInput.addEventListener("input", renderProducts);
refreshButton.addEventListener("click", loadProducts);

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!pendingEdit) return;

  const product = pendingEdit;
  saveEditButton.disabled = true;
  saveEditButton.textContent = "Salvando...";
  try {
    const updated = await apiRequest(`/produtos/${product.id}`, {
      method: "PUT",
      body: JSON.stringify(productPayload(
        editName.value,
        editDescription.value,
        editImage.value,
      )),
    });
    await loadProducts();
    showToast(`${updated.nome} foi atualizado.`);
    editDialog.close();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    saveEditButton.disabled = false;
    saveEditButton.textContent = "Salvar alterações";
  }
});

document.querySelector("#cancel-edit").addEventListener("click", () => {
  editDialog.close();
});

editDialog.addEventListener("close", () => {
  pendingEdit = null;
});

deleteDialog.querySelector("form").addEventListener("submit", async (event) => {
  if (event.submitter?.value !== "confirm" || !pendingDelete) return;
  event.preventDefault();

  const product = pendingDelete;
  confirmDeleteButton.disabled = true;
  confirmDeleteButton.textContent = "Removendo...";
  try {
    await apiRequest(`/produtos/${product.id}`, { method: "DELETE" });
    await loadProducts();
    showToast(`${product.nome} foi removido da coleção.`);
    deleteDialog.close();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    confirmDeleteButton.disabled = false;
    confirmDeleteButton.textContent = "Sim, remover";
  }
});

deleteDialog.addEventListener("close", () => {
  pendingDelete = null;
});

document.addEventListener("keydown", (event) => {
  const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
    || document.activeElement?.isContentEditable;
  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    searchInput.focus();
  }
});

loadProducts();
