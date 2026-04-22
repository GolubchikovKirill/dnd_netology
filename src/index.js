import "./styles.css";

const STORAGE_KEY = "trello-board-state";

function createDefaultState() {
  return [
    {
      id: "todo",
      title: "Todo",
      cards: [
        { id: String(Date.now() + 1), text: "Сделать домашнее задание" },
        { id: String(Date.now() + 2), text: "Разобраться с drag and drop" },
      ],
    },
    {
      id: "in-progress",
      title: "In progress",
      cards: [{ id: String(Date.now() + 3), text: "Сверстать карточки" }],
    },
    {
      id: "done",
      title: "Done",
      cards: [{ id: String(Date.now() + 4), text: "Создать репозиторий" }],
    },
  ];
}

class TrelloBoard {
  constructor(container) {
    this.container = container;
    this.state = this.loadState();
    this.dragData = null;

    this.onClick = this.onClick.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.container.addEventListener("click", this.onClick);
    this.container.addEventListener("submit", this.onSubmit);
    this.container.addEventListener("mousedown", this.onMouseDown);

    this.render();
  }

  loadState() {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return createDefaultState();
    }

    try {
      return JSON.parse(savedState);
    } catch (error) {
      return createDefaultState();
    }
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  render() {
    this.container.innerHTML = `
      <div class="board">
        ${this.state.map((column) => this.getColumnMarkup(column)).join("")}
      </div>
    `;
  }

  getColumnMarkup(column) {
    return `
      <section class="column" data-column-id="${column.id}">
        <h2 class="column-title">${column.title}</h2>
        <div class="cards">
          ${column.cards.map((card) => this.getCardMarkup(card)).join("")}
        </div>
        <div class="column-footer">
          <button type="button" class="add-card-btn">+ Add another card</button>
          <form class="add-card-form">
            <textarea class="add-card-input" name="text" placeholder="Enter a title for this card..."></textarea>
            <div class="add-card-actions">
              <button class="add-card-submit" type="submit">Add Card</button>
              <button class="add-card-cancel" type="button">Cancel</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  getCardMarkup(card) {
    return `
      <article class="card" data-card-id="${card.id}">
        <div class="card-text">${card.text}</div>
        <button type="button" class="card-remove">&#10005;</button>
      </article>
    `;
  }

  onClick(event) {
    const addButton = event.target.closest(".add-card-btn");
    if (addButton) {
      const column = addButton.closest(".column");
      this.showForm(column);
      return;
    }

    const cancelButton = event.target.closest(".add-card-cancel");
    if (cancelButton) {
      const column = cancelButton.closest(".column");
      this.hideForm(column);
      return;
    }

    const removeButton = event.target.closest(".card-remove");
    if (removeButton) {
      const card = removeButton.closest(".card");
      const column = removeButton.closest(".column");
      this.removeCard(column.dataset.columnId, card.dataset.cardId);
    }
  }

  onSubmit(event) {
    event.preventDefault();

    const form = event.target.closest(".add-card-form");
    if (!form) {
      return;
    }

    const column = form.closest(".column");
    const textarea = form.querySelector(".add-card-input");
    const text = textarea.value.trim();

    if (!text) {
      textarea.focus();
      return;
    }

    this.addCard(column.dataset.columnId, text);
    this.hideForm(column);
  }

  onMouseDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest(".card-remove")) {
      return;
    }

    const card = event.target.closest(".card");
    if (!card) {
      return;
    }

    event.preventDefault();

    const rect = card.getBoundingClientRect();

    this.dragData = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      sourceCard: card,
      dragElement: null,
      placeholder: null,
      isDragging: false,
    };

    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  onMouseMove(event) {
    if (!this.dragData) {
      return;
    }

    if (!this.dragData.isDragging) {
      const shiftX = Math.abs(event.clientX - this.dragData.startX);
      const shiftY = Math.abs(event.clientY - this.dragData.startY);

      if (shiftX < 5 && shiftY < 5) {
        return;
      }

      this.startDragging();
    }

    this.moveDraggedCard(event.clientX, event.clientY);
    this.movePlaceholder(event.clientX, event.clientY);
  }

  onMouseUp() {
    if (!this.dragData) {
      return;
    }

    if (this.dragData.isDragging) {
      this.finishDragging();
    }

    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.body.classList.remove("dragging");
    this.dragData = null;
  }

  startDragging() {
    const { sourceCard } = this.dragData;
    const rect = sourceCard.getBoundingClientRect();

    const dragElement = sourceCard.cloneNode(true);
    dragElement.classList.add("card_dragged");
    dragElement.style.width = `${rect.width}px`;
    dragElement.style.height = `${rect.height}px`;

    const placeholder = document.createElement("div");
    placeholder.className = "card-placeholder";
    placeholder.style.height = `${rect.height}px`;

    sourceCard.after(placeholder);
    sourceCard.classList.add("card_hidden");
    document.body.appendChild(dragElement);
    document.body.classList.add("dragging");

    this.dragData.dragElement = dragElement;
    this.dragData.placeholder = placeholder;
    this.dragData.isDragging = true;
  }

  moveDraggedCard(clientX, clientY) {
    const { dragElement, offsetX, offsetY } = this.dragData;

    dragElement.style.left = `${clientX - offsetX}px`;
    dragElement.style.top = `${clientY - offsetY}px`;
  }

  movePlaceholder(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    const column = element ? element.closest(".column") : null;

    if (!column) {
      return;
    }

    const cardsContainer = column.querySelector(".cards");
    const nextCard = this.getNextCard(cardsContainer, clientY);

    if (nextCard) {
      cardsContainer.insertBefore(this.dragData.placeholder, nextCard);
      return;
    }

    cardsContainer.appendChild(this.dragData.placeholder);
  }

  getNextCard(container, clientY) {
    const cards = [...container.querySelectorAll(".card:not(.card_hidden)")];

    return cards.find((card) => {
      const rect = card.getBoundingClientRect();
      return clientY < rect.top + rect.height / 2;
    });
  }

  finishDragging() {
    const { sourceCard, placeholder, dragElement } = this.dragData;

    placeholder.replaceWith(sourceCard);
    sourceCard.classList.remove("card_hidden");
    dragElement.remove();

    this.syncStateWithDom();
    this.saveState();
  }

  syncStateWithDom() {
    const nextState = this.state.map((column) => ({
      ...column,
      cards: [],
    }));

    const columns = [...this.container.querySelectorAll(".column")];

    columns.forEach((columnElement) => {
      const columnId = columnElement.dataset.columnId;
      const columnState = nextState.find((item) => item.id === columnId);
      const cards = [...columnElement.querySelectorAll(".card")];

      columnState.cards = cards.map((card) => ({
        id: card.dataset.cardId,
        text: card.querySelector(".card-text").textContent,
      }));
    });

    this.state = nextState;
  }

  showForm(column) {
    const button = column.querySelector(".add-card-btn");
    const form = column.querySelector(".add-card-form");
    const textarea = column.querySelector(".add-card-input");

    button.style.display = "none";
    form.classList.add("add-card-form_active");
    textarea.focus();
  }

  hideForm(column) {
    const button = column.querySelector(".add-card-btn");
    const form = column.querySelector(".add-card-form");
    const textarea = column.querySelector(".add-card-input");

    form.reset();
    form.classList.remove("add-card-form_active");
    button.style.display = "block";
  }

  addCard(columnId, text) {
    const column = this.state.find((item) => item.id === columnId);

    column.cards.push({
      id: String(Date.now()),
      text,
    });

    this.saveState();
    this.render();
  }

  removeCard(columnId, cardId) {
    const column = this.state.find((item) => item.id === columnId);
    column.cards = column.cards.filter((card) => card.id !== cardId);

    this.saveState();
    this.render();
  }
}

const container = document.querySelector("#app");
const board = new TrelloBoard(container);

board.saveState();
