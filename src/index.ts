interface Pile {
  cards: HTMLElement[];
  elem: HTMLElement | null;
}

const pile: {
  [key: string]: Pile | undefined;
  deck: Pile;
  discard: Pile;
  pickaxeSlot: Pile;
} = {
  deck: { cards: [], elem: null },
  discard: { cards: [], elem: null },
  pickaxeSlot: { cards: [], elem: null },
};

const drawing: HTMLElement[] = [];

let gameElem: HTMLElement | null;
let gameRect: DOMRect;
let storeElem: HTMLElement | null;
let deckScreenElem: HTMLElement | null;

let pickaxeTimer: NodeJS.Timer;

const resources: {
  [key: string]: number | undefined;
  stone: number;
  iron: number;
  diamond: number;
  tnt: number;
  stairs: number;
} = { stone: 0, iron: 0, diamond: 0, tnt: 0, stairs: 0 };

function startGame(): void {
  pile.deck.elem = document.getElementById("deck");
  pile.discard.elem = document.getElementById("discard");
  pile.pickaxeSlot.elem = document.getElementById("pickaxeSlot");

  gameElem = document.getElementById("game");
  if (gameElem) gameRect = gameElem.getBoundingClientRect();

  storeElem = document.getElementById("store");
  deckScreenElem = document.getElementById("deck-screen");

  if (deckScreenElem) {
    const close: HTMLElement | null =
      deckScreenElem.querySelector(".close-button");
    if (close) close.onclick = closeDeckScreen;
  }

  makeStartingDeck();
  makeStore();
  updateResources();
}

function updateResources(): void {
  for (const resource in resources) {
    const elem = document.querySelector(".inventory-slot." + resource);
    if (elem) {
      const e = elem.querySelector(".current");
      if (e) (e as any).innerText = resources[resource];
    }
  }

  if (storeElem) {
    for (let i = 0; i < storeElem.children.length; i++) {
      const product = storeElem.children[i] as HTMLElement;

      if (product.dataset.ability == "purge") {
        product.dataset.cost = String(getDestroyCost());
        const count: HTMLElement | null =
          product.querySelector(".resource-count");
        if (count) count.innerText = String(getDestroyCost());
      }
      product.classList.toggle("unaffordable", !isAffordable(product));
    }
  }

  updateDeckScreen();
  updateBgColor();
}

function shuffleCards<T>(cardElems: T[]): T[] {
  const shuffledCards: T[] = [];
  while (cardElems.length) {
    const r = Math.floor(Math.random() * cardElems.length);
    shuffledCards.push(cardElems[r]);
    cardElems.splice(r, 1);
  }
  return shuffledCards;
}

function drawCard(): void {
  if (pile.deck.cards.length == 0) return;

  const elem = pile.deck.cards[pile.deck.cards.length - 1];
  if (drawing.indexOf(elem) > -1) return;

  pile.deck.cards.splice(pile.deck.cards.length - 1, 1);

  moveCard(elem, pile.discard);
  elem.classList.remove("face-down");
  elem.classList.add("flipping-up");

  setTimeout(() => applyCard(elem), 300);
}

function applyCard(card: HTMLElement): void {
  if (card.dataset.resource == "upgrade") {
    upgradeRandomCard();
  } else {
    adjustResource(card.dataset.resource ?? "", card.dataset.value);
  }
}

function upgradeRandomCard(): void {
  if (pile.discard.cards.length > 0) {
    let card: HTMLElement | null = null;
    for (let i = pile.discard.cards.length - 1; i >= 0; i--) {
      const c = pile.discard.cards[i];
      if (
        (c.dataset.resource ?? "") in resources &&
        c.dataset.resource != "stairs" &&
        parseInt(String(c.dataset.value)) < 10
      ) {
        card = c;
        break;
      }
    }

    if (card != null) {
      const data = `${card.dataset.resource} ${
        parseInt(String(card.dataset.value)) + 1
      }`;
      setCard(card, data);
    }
  }
}

function adjustResource(resource: string, value: unknown): void {
  const count = parseInt(String(value));
  if (resource in resources && !isNaN(count)) {
    const max = resource == "stairs" ? MAX_LEVEL : MAX_INVENTORY;
    resources[resource] = Math.max(
      0,
      Math.min((resources[resource] ?? 0) + count, max)
    );

    updateResources();

    if (resource == "stairs" && resources.stairs == MAX_LEVEL) {
      const e = document.getElementById("victory");
      if (e) e.style.display = "block";
      clearInterval(pickaxeTimer);
    }
  }
}

function shuffleDiscardIntoDeck(): void {
  const shuffledCards = shuffleCards<HTMLElement>(pile.discard.cards);
  pile.discard.cards = [];

  for (let i = 0; i < shuffledCards.length; i++) {
    shuffledCards[i].classList.add("face-down", "flipping-down");
    moveCard(shuffledCards[i], pile.deck);
  }
}

function addCardToPile(pile: Pile, cardElem: HTMLElement, index: number): void {
  if (pile.cards) {
    pile.cards.push(cardElem);
  }
  if (!pile.elem) return;
  const rect = pile.elem.getBoundingClientRect();
  const offset = getOffset(index);
  const x = rect.left - gameRect.left + offset.x;
  const y = rect.top - gameRect.top + offset.y;
  const r = offset.r;

  cardElem.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`;
}

interface Offset {
  x: number;
  y: number;
  r: number;
}

function getOffset(index: number): Offset {
  return {
    x: Math.random() * 4 - 2,
    y: index * -2 + (Math.random() - 0.5),
    r: Math.random() * 4 - 2,
  };
}

function moveCard(cardElem: HTMLElement, toPile: Pile): HTMLElement {
  drawing.push(cardElem);

  const moveDuration = 1000;
  const newIndex = toPile.cards.length;

  cardElem.style.transition = `transform ${moveDuration}ms ease-in-out`;
  cardElem.style.zIndex = String(100 + newIndex);

  addCardToPile(toPile, cardElem, newIndex);
  setTimeout(onCardMovementComplete.bind(cardElem), moveDuration);

  return cardElem;
}

function onCardMovementComplete(): void {
  this.style.zIndex -= 100;
  this.classList.remove("flipping-up", "flipping-down");

  const i = drawing.indexOf(this);
  if (i > -1) drawing.splice(i, 1);

  if (pile.deck.cards.length == 0 && drawing.length == 0) {
    shuffleDiscardIntoDeck();
  }

  tryApplyTool(getTool(this.dataset));
}

function onDeckCardClick(): void {
  if (pile.deck.cards.indexOf(this) > -1) {
    drawCard();
  }
}

function onProductClick(): void {
  if (isAffordable(this.parentElement)) {
    if (this.parentElement.dataset.ability == "purge") {
      showDeckScreen();
    } else if (this.parentElement.dataset.card) {
      adjustResource(
        this.parentElement.dataset.resource,
        -this.parentElement.dataset.cost
      );

      const protoCard = this.parentElement.querySelector(".card");
      const newCard = createDeckCard(this.parentElement.dataset.card);
      addCardToPile({ cards: [], elem: protoCard }, newCard, 0);

      let targetPile = pile.discard;

      const toolPile = protoCard.dataset.value + "Slot";
      if (toolPile in pile) {
        targetPile = pile.pickaxeSlot;

        const nextTool = getTool(protoCard.dataset, 1);
        replaceProduct(this.parentElement, nextTool);
      }

      requestAnimationFrame(() => moveCard(newCard, targetPile));
    }
  }
}

function tryApplyTool(data: any): void {
  if (!data) return;
  if (data.tool == "pickaxe") {
    clearInterval(pickaxeTimer);
    pickaxeTimer = setInterval(drawCard, data.timer * 1000);
    drawCard();
  }
}

function isAffordable(productElem: HTMLElement): boolean {
  const resource = productElem.dataset.resource ?? "";
  if (resource in resources) {
    return (
      (resources[resource] ?? 0) >= parseInt(productElem.dataset.cost ?? "")
    );
  }
  return true; // must be free
}

function showDeckScreen(): void {
  deckScreenElem.style.display = "flex";

  const container = deckScreenElem.querySelector(".card-container");
  const cards = pile.deck.cards.concat(pile.discard.cards);

  for (let i = 0; i < cards.length; i++) {
    const clone = cards[i].cloneNode(true) as HTMLElement;
    clone.style.transform = "";
    clone.classList.value = "card";
    clone.onclick = onDestroyCardClick;
    container.appendChild(clone);
  }

  updateDeckScreen();
}

function updateDeckScreen(): void {
  if (deckScreenElem.style.display != "none") {
    const cost = getDestroyCost();
    const count: HTMLElement | null =
      deckScreenElem.querySelector(".resource-count");
    if (count) count.innerText = String(cost);
    deckScreenElem.classList.toggle("unaffordable", resources.tnt < cost);
  }
}

function onDestroyCardClick(): void {
  if (resources.tnt >= getDestroyCost()) {
    if (!tryRemoveCard(this.dataset, pile.deck)) {
      tryRemoveCard(this.dataset, pile.discard);
    }
    adjustResource("tnt", -getDestroyCost());
    this.classList.add("destroyed");
    this.onclick = null;
  }
}

function closeDeckScreen(): void {
  deckScreenElem.style.display = "none";

  const container = deckScreenElem.querySelector(".card-container");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function tryRemoveCard(data: any, pile: Pile): boolean {
  for (let i = 0; i < pile.cards.length; i++) {
    const card = pile.cards[i];
    if (
      card.dataset.resource == data.resource &&
      card.dataset.value == data.value
    ) {
      card.parentElement?.removeChild(card);
      pile.cards.splice(i, 1);
      return true;
    }
  }
  return false;
}

function updateBgColor(): void {
  const level = resources.stairs;
  const sectionSize = MAX_LEVEL / (BG_COLORS.length - 1);

  const sectionIndex = Math.floor(level / sectionSize);
  const leftColor = BG_COLORS[sectionIndex];
  const rightColor =
    level == MAX_LEVEL ? leftColor : BG_COLORS[sectionIndex + 1];

  const p = (level % sectionSize) / sectionSize;
  const r = rightColor[0] * p + leftColor[0] * (1 - p);
  const g = rightColor[1] * p + leftColor[1] * (1 - p);
  const b = rightColor[2] * p + leftColor[2] * (1 - p);

  if (gameElem) gameElem.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function makeStartingDeck(): void {
  let deck: any[] = [];
  STARTING_DECK.forEach(function (c) {
    for (let n = 0; n < c.count; n++) {
      deck.push(createDeckCard(c.card));
    }
  });
  deck = shuffleCards(deck);

  for (let i = 0; i < deck.length; i++) {
    const p = {
      cards: pile.deck.cards,
      elem: pile.deck.elem,
    };
    addCardToPile(p, deck[i], i);
    deck[i].style.zIndex = i;
    deck[i].classList.add("face-down");
  }
}

function createDeckCard(data: string): HTMLDivElement {
  const cardElem = createCard(data);
  if (gameElem) gameElem.appendChild(cardElem);
  return cardElem;
}

function makeStore(): void {
  STORE_CONTENTS.forEach(function (c) {
    if (!storeElem) return;
    const product = createProduct(c);
    storeElem.appendChild(product);
    const e: HTMLElement | null = product.querySelector(".buy-button");
    if (e) e.onclick = onProductClick;
  });
}

function replaceProduct(productElem: HTMLElement, data?: StoreItem): void {
  if (data == null) {
    productElem.classList.add("soldout");
    const buy: HTMLElement | null = productElem.querySelector(".buy-button");
    if (buy) buy.onclick = null;
    return;
  }

  setProductData(productElem, data);

  const cards = productElem.querySelectorAll(".card");
  for (let i = 0; i < cards.length; i++) {
    setCard(cards[i] as HTMLElement, data.card ?? "");
  }

  const buyButton = productElem.querySelector(".buy-button");
  if (buyButton) buyButton.innerHTML = getBuyButtonHTML(data.cost);

  productElem.classList.toggle("unaffordable", !isAffordable(productElem));
}

function createProduct(data: StoreItem): HTMLDivElement {
  const productElem = document.createElement("div");
  productElem.classList.add("product");

  setProductData(productElem, data);

  if (data.card) {
    for (let i = 0; i < 3; i++) {
      const cardElem = createCard(data.card);
      const o = getOffset(i);
      cardElem.style.transform = `translate(${o.x}px, ${o.y}px) rotate(${o.r}deg)`;
      (cardElem as any).style.zIndex = i;
      productElem.appendChild(cardElem);
    }
  } else if (data.ability) {
    const optionElem = document.createElement("div");
    optionElem.classList.add(data.ability, "ability");
    productElem.appendChild(optionElem);
  }

  const buyButton = document.createElement("div");
  buyButton.classList.add("buy-button");
  buyButton.innerHTML = getBuyButtonHTML(data.cost);
  productElem.appendChild(buyButton);

  return productElem;
}

function setProductData(productElem: HTMLElement, data: StoreItem): void {
  productElem.dataset.card = data.card;
  productElem.dataset.ability = data.ability;

  if (data.cost) {
    const costParts = data.cost.split(" ");
    productElem.dataset.resource = costParts[0];
    productElem.dataset.cost = costParts[1];
  }
}

function getBuyButtonHTML(data: string): string {
  const parts = data.split(" ");
  if (data) {
    return `
            <span class="resource-count">${parts[1]}</span>
            <div class="resource-icon ${parts[0]}"></div>
        `;
  } else {
    return '<span class="resource-count">Free</span>';
  }
}

function createCard(data: string): HTMLDivElement {
  const cardElem = document.createElement("div");
  cardElem.classList.add("card");
  setCard(cardElem, data);
  return cardElem;
}

function setCard(cardElem: HTMLElement, data: string): void {
  const parts = data.split(" ");
  const resource = parts[0];
  const value = parts[1];
  cardElem.innerHTML = getCardHTML(resource, value);
  cardElem.dataset.resource = resource;
  cardElem.dataset.value = value;
}

function getCardHTML(resource: string, value: string | number): string {
  let contentHTML = "";
  let topHTML = "";
  let bottomHTML = "";

  if (resource == "stairs" || resource == "upgrade") {
    topHTML = `<span class="name label">${resource}</span>`;
    bottomHTML =
      resource == "stairs"
        ? '<div class="description label">Descend one level deeper.</div>'
        : '<div class="description label">Upgrade a resource card.</div>';
  } else if (isNaN(parseInt(String(value)))) {
    topHTML = `<span class="name label">${resource} ${value}</span>`;
    const timer = getTool({ resource, value }).timer;
    bottomHTML = `<div class="description label">Mines a card every ${timer}s.</div>`;
  } else {
    topHTML = `<div class="top label"><span className="count">${value}</span></div>`;
    bottomHTML = `<div class="bottom label"><span className="count">${value}</span></div>`;
  }

  if (value == "pickaxe") {
    contentHTML = `<img src="img/${resource}_${value}.png" />`;
  } else {
    for (let i = 0; i < value; i++) {
      contentHTML += `<img src="img/${resource}_icon.png" />`;
    }
  }

  return `
        <div class="wrapper">
            <div class="body">
                <div class="front">
                    ${topHTML}
                    <div class="content">${contentHTML}</div>
                    ${bottomHTML}
                </div>
                <div class="back"></div>
            </div>
        </div>
    `;
}

const MAX_INVENTORY = 999;
const MAX_LEVEL = 100;

interface StartingCardCount {
  card: string;
  count: number;
}

const STARTING_DECK: StartingCardCount[] = [
  { card: "stone 1", count: 8 },
  { card: "stairs 1", count: 1 },
];

interface StoreItem {
  card?: string;
  ability?: string;
  cost: string;
  level: number;
}

const STORE_CONTENTS: StoreItem[] = [
  { card: "old pickaxe", cost: "", level: 0 },
  { card: "stone 1", cost: "", level: 1 },
  { card: "stone 3", cost: "stone 5", level: 1 },
  { card: "stone 5", cost: "stone 20", level: 1 },
  { card: "iron 1", cost: "stone 50", level: 5 },
  { card: "iron 3", cost: "iron 5", level: 5 },
  { card: "iron 5", cost: "iron 20", level: 5 },
  { card: "diamond 1", cost: "iron 50", level: 15 },
  { card: "tnt 1", cost: "iron 1", level: 10 },
  { card: "stairs 1", cost: "diamond 5", level: 5 },
  { card: "upgrade 1", cost: "stone 30", level: 5 },
  { ability: "purge", cost: "tnt 1", level: 10 },
];

interface Pickaxe {
  card: string;
  cost?: string;
  timer: number;
}

const TOOLS: {
  [key: string]: any;
  pickaxe: Pickaxe[];
} = {
  pickaxe: [
    { card: "old pickaxe", timer: 1.5 },
    { card: "stone pickaxe", cost: "stone 15", timer: 1.25 },
    { card: "iron pickaxe", cost: "iron 15", timer: 1 },
    { card: "diamond pickaxe", cost: "diamond 15", timer: 0.5 },
  ],
};

function getTool(data: any, offset = 0) {
  if (data.value in TOOLS) {
    const tool = TOOLS[data.value];
    for (let i = 0; i < tool.length; i++) {
      if (tool[i].card.startsWith(data.resource)) {
        const toolData = tool[i + offset];
        if (toolData) toolData.tool = data.value;
        return toolData;
      }
    }
  }
}

function getDestroyCost(): number {
  const deckSize = pile.deck.cards.concat(pile.discard.cards).length;
  return Math.ceil(2000 / (deckSize * deckSize));
}

const BG_COLORS = [
  [165, 144, 108],
  [88, 68, 33],
  [130, 73, 73],
  [142, 81, 123],
  [102, 119, 199],
  [0, 37, 68],
];

(function () {
  startGame();
})();
