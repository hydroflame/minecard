import React from "react";
import { createRoot, Root } from "react-dom/client";
import { BuyButtonText } from "./BuyButtonText";
import { CardContent } from "./CardContent";
import { DeckScreen } from "./DeckScreen";
import { Inventory } from "./Inventory";
import "./style.scss";

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
let storeElem: HTMLElement | null;
let deckScreenElem: HTMLElement | null;
let header: Root | null = null;

let deckScreenRoot: Root | null = null;

let pickaxeTimer: NodeJS.Timer;

const resources: {
  [key: string]: number | undefined;
  stone: number;
  iron: number;
  diamond: number;
  tnt: number;
  stairs: number;
} = { stone: 0, iron: 0, diamond: 0, tnt: 999, stairs: 0 };

function startGame(): void {
  pile.deck.elem = document.getElementById("deck");
  pile.discard.elem = document.getElementById("discard");
  pile.pickaxeSlot.elem = document.getElementById("pickaxeSlot");

  gameElem = document.getElementById("game");

  storeElem = document.getElementById("store");
  const headerElem = document.getElementById("header");
  if (headerElem) {
    header = createRoot(headerElem);
  }

  deckScreenElem = document.getElementById("deck-screen-root");
  if (deckScreenElem) {
    deckScreenRoot = createRoot(deckScreenElem);
  }

  makeStartingDeck();
  makeStore();
  updateResources();
}

function updateResources(): void {
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

  if (header)
    header.render(
      <Inventory
        level={resources.stairs}
        max={MAX_LEVEL}
        stone={resources.stone}
        iron={resources.iron}
        diamond={resources.diamond}
        tnt={resources.tnt}
      />
    );

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
    adjustResource(card.dataset.resource ?? "", card.dataset.value ?? 0);
  }
}

function upgradeRandomCard(): void {
  if (pile.discard.cards.length === 0) return;
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

  if (card == null) return;
  const data = `${card.dataset.resource ?? ""} ${
    parseInt(String(card.dataset.value)) + 1
  }`;
  setCard(card, data);
}

function adjustResource(resource: string, value: string | number): void {
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
  if (!gameElem) return;
  if (pile.cards) {
    pile.cards.push(cardElem);
  }
  if (!pile.elem) return;
  const rect = pile.elem.getBoundingClientRect();
  const offset = getOffset(index);
  const gameRect = gameElem.getBoundingClientRect();
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
  setTimeout(onCardMovementComplete(cardElem), moveDuration);

  return cardElem;
}

function onCardMovementComplete(elem: HTMLElement): () => void {
  return () => {
    elem.style.zIndex = String(parseFloat(elem.style.zIndex) - 100);
    elem.classList.remove("flipping-up", "flipping-down");

    const i = drawing.indexOf(elem);
    if (i > -1) drawing.splice(i, 1);

    if (pile.deck.cards.length == 0 && drawing.length == 0) {
      shuffleDiscardIntoDeck();
    }

    if (elem.dataset.value === "pickaxe") {
      const tool = getTool(elem.dataset.resource ?? "");
      if (tool) tryApplyTool(tool);
    }
  };
}

function onProductClick(elem: HTMLElement): () => void {
  return () => {
    const parent = elem.parentElement;
    if (!parent) return;
    if (!isAffordable(parent)) return;
    if (parent.dataset.ability == "purge") {
      renderDeckScreen();
    } else if (parent.dataset.card) {
      adjustResource(
        parent.dataset.resource ?? "",
        -parseFloat(parent.dataset.cost ?? "0")
      );

      const protoCard: HTMLElement | null = parent.querySelector(".card");
      if (!protoCard) return;
      const newCard = createDeckCard(parent.dataset.card);
      addCardToPile({ cards: [], elem: protoCard }, newCard, 0);

      let targetPile = pile.discard;

      const toolPile = String(protoCard.dataset.value) + "Slot";
      if (toolPile in pile) {
        targetPile = pile.pickaxeSlot;

        const nextTool = getTool(protoCard.dataset.resource ?? "", 1);
        if (nextTool)
          replaceProduct(parent, {
            ...nextTool,
            cost: nextTool.cost ?? "",
          });
      }

      requestAnimationFrame(() => moveCard(newCard, targetPile));
    }
  };
}

function tryApplyTool(data: Pickaxe): void {
  if (!data) return;
  clearInterval(pickaxeTimer);
  pickaxeTimer = setInterval(drawCard, data.timer * 1000);
  drawCard();
}

export function isAffordable(productElem: HTMLElement): boolean {
  const resource = productElem.dataset.resource ?? "";
  if (resource in resources) {
    return (
      (resources[resource] ?? 0) >= parseInt(productElem.dataset.cost ?? "")
    );
  }
  return true; // must be free
}

function renderDeckScreen(): void {
  if (!deckScreenRoot) return;
  const cards = pile.deck.cards.concat(pile.discard.cards);
  deckScreenRoot.render(
    <DeckScreen
      cards={cards}
      onClick={(resource?: string, value?: string) =>
        onDestroyCardClick({ resource, value })
      }
      onClose={() => deckScreenRoot?.render(<></>)}
      tnt={resources.tnt}
    />
  );
}

function onDestroyCardClick(dataset: DOMStringMap): void {
  if (resources.tnt >= getDestroyCost()) {
    adjustResource("tnt", -getDestroyCost());
    if (!tryRemoveCard(dataset, pile.deck)) {
      tryRemoveCard(dataset, pile.discard);
    }
  }
  renderDeckScreen();
  updateResources();
}

function tryRemoveCard(data: DOMStringMap, pile: Pile): boolean {
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
  let deck: HTMLDivElement[] = [];
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
    deck[i].style.zIndex = String(i);
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
    if (e) e.onclick = onProductClick(e);
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
  if (buyButton) {
    const container = createRoot(buyButton);
    container.render(<BuyButtonText data={data.cost} />);
  }

  productElem.classList.toggle("unaffordable", !isAffordable(productElem));
}

function createProduct(data: StoreItem): HTMLDivElement {
  const productElem = document.createElement("div");
  productElem.classList.add("product");

  setProductData(productElem, data);

  if (data.ability === "purge") data.cost = "tnt " + String(getDestroyCost());

  if (data.card) {
    for (let i = 0; i < 3; i++) {
      const cardElem = createCard(data.card);
      const o = getOffset(i);
      cardElem.style.transform = `translate(${o.x}px, ${o.y}px) rotate(${o.r}deg)`;
      cardElem.style.zIndex = String(i);
      productElem.appendChild(cardElem);
    }
  } else if (data.ability) {
    const optionElem = document.createElement("div");
    optionElem.classList.add(data.ability, "ability");
    productElem.appendChild(optionElem);
  }

  const buyButton = document.createElement("div");
  buyButton.classList.add("buy-button");
  const container = createRoot(buyButton);
  container.render(<BuyButtonText data={data.cost} />);
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
  cardElem.dataset.resource = resource;
  cardElem.dataset.value = value;
  const container = createRoot(cardElem);
  container.render(<CardContent resource={resource} value={value} />);
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
}

const STORE_CONTENTS: StoreItem[] = [
  { card: "old pickaxe", cost: "" },
  { card: "stone 1", cost: "" },
  { card: "stone 3", cost: "stone 5" },
  { card: "stone 5", cost: "stone 20" },
  { card: "iron 1", cost: "stone 50" },
  { card: "iron 3", cost: "iron 5" },
  { card: "iron 5", cost: "iron 20" },
  { card: "diamond 1", cost: "iron 50" },
  { card: "tnt 1", cost: "iron 1" },
  { card: "stairs 1", cost: "diamond 5" },
  { card: "upgrade 1", cost: "stone 30" },
  { ability: "purge", cost: "tnt 1" },
];

interface Pickaxe {
  card: string;
  cost?: string;
  timer: number;
}

const TOOLS: {
  pickaxe: Pickaxe[];
} = {
  pickaxe: [
    { card: "old pickaxe", timer: 1.5 },
    { card: "stone pickaxe", cost: "stone 15", timer: 1.25 },
    { card: "iron pickaxe", cost: "iron 15", timer: 1 },
    { card: "diamond pickaxe", cost: "diamond 15", timer: 0.5 },
  ],
};

export function getTool(resource: string, offset = 0): Pickaxe | undefined {
  const tool = TOOLS.pickaxe;
  for (let i = 0; i < tool.length; i++) {
    if (tool[i].card.startsWith(resource)) {
      return tool[i + offset];
    }
  }
}

export function getDestroyCost(): number {
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
