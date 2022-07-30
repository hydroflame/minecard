let pile: any = {
  deck: { cards: [] as any[] },
  discard: { cards: [] as any[] },
  pickaxeSlot: { cards: [] as any[] },
  cartSlot: { cards: [] as any[] },
};

let drawing: any[] = [];

let gameElem: any;
let gameRect: any;
let storeElem: any;
let deckScreenElem: any;

let pickaxeTimer: any;

let resources: any = { stone: 0, iron: 0, diamond: 0, tnt: 0, stairs: 0 };

function startGame() {
  for (let id in pile) {
    pile[id].elem = document.getElementById(id);
  }

  gameElem = document.getElementById("game");
  gameRect = gameElem.getBoundingClientRect();

  storeElem = document.getElementById("store");
  deckScreenElem = document.getElementById("deck-screen");

  deckScreenElem.querySelector(".close-button").onclick = closeDeckScreen;

  makeStartingDeck();
  makeStore();
  updateResources();
}

function updateResources() {
  for (let resource in resources) {
    let elem = document.querySelector(".inventory-slot." + resource);
    if (elem) {
      const e = elem.querySelector(".current");
      if (e) (e as any).innerText = resources[resource];
    }
  }

  for (let i = 0; i < storeElem.children.length; i++) {
    let product = storeElem.children[i];

    if (product.dataset.ability == "purge") {
      product.dataset.cost = getDestroyCost();
      product.querySelector(".resource-count").innerText = getDestroyCost();
    }
    product.classList.toggle("unaffordable", !isAffordable(product));
  }

  updateDeckScreen();
  updateBgColor();
}

function shuffleCards(cardElems: any) {
  const shuffledCards: any[] = [];
  while (cardElems.length) {
    const r = Math.floor(Math.random() * cardElems.length);
    shuffledCards.push(cardElems[r]);
    cardElems.splice(r, 1);
  }
  return shuffledCards;
}

function drawCard() {
  if (pile.deck.cards.length == 0) return;

  const elem = pile.deck.cards[pile.deck.cards.length - 1];
  if (drawing.indexOf(elem) > -1) return;

  pile.deck.cards.splice(pile.deck.cards.length - 1, 1);

  moveCard(elem, pile.discard);
  elem.classList.remove("face-down");
  elem.classList.add("flipping-up");

  setTimeout(() => applyCard(elem), 300);
}

function applyCard(card: any) {
  if (card.dataset.resource == "upgrade") {
    upgradeRandomCard();
  } else {
    adjustResource(card.dataset.resource, card.dataset.value);
  }
}

function upgradeRandomCard() {
  if (pile.discard.cards.length > 0) {
    let card;
    for (let i = pile.discard.cards.length - 1; i >= 0; i--) {
      const c = pile.discard.cards[i];
      if (
        c.dataset.resource in resources &&
        c.dataset.resource != "stairs" &&
        parseInt(c.dataset.value) < 10
      ) {
        card = c;
        break;
      }
    }

    if (card != null) {
      const data = `${card.dataset.resource} ${
        parseInt(card.dataset.value) + 1
      }`;
      setCard(card, data);
    }
  }
}

function adjustResource(resource: any, value: any) {
  const count = parseInt(value);
  if (resource in resources && !isNaN(count)) {
    const max = resource == "stairs" ? MAX_LEVEL : MAX_INVENTORY;
    resources[resource] = Math.max(
      0,
      Math.min(resources[resource] + count, max)
    );

    updateResources();

    if (resource == "stairs" && resources.stairs == MAX_LEVEL) {
      const e = document.getElementById("victory");
      if (e) e.style.display = "block";
      clearInterval(pickaxeTimer);
    }
  }
}

function shuffleDiscardIntoDeck() {
  const shuffledCards = shuffleCards(pile.discard.cards);
  pile.discard.cards = [];

  for (let i = 0; i < shuffledCards.length; i++) {
    shuffledCards[i].classList.add("face-down", "flipping-down");
    moveCard(shuffledCards[i], pile.deck);
  }
}

function addCardToPile(pile: any, cardElem: any, index: any) {
  if (pile.cards) {
    pile.cards.push(cardElem);
  }

  const rect = pile.elem.getBoundingClientRect();
  const offset = getOffset(index);
  let x = rect.left - gameRect.left + offset.x;
  let y = rect.top - gameRect.top + offset.y;
  let r = offset.r;

  cardElem.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`;
}

function getOffset(index: any) {
  return {
    x: Math.random() * 4 - 2,
    y: index * -2 + (Math.random() - 0.5),
    r: Math.random() * 4 - 2,
  };
}

function moveCard(cardElem: any, toPile: any) {
  drawing.push(cardElem);

  const moveDuration = 1000;
  const newIndex = toPile.cards.length;

  cardElem.style.transition = `transform ${moveDuration}ms ease-in-out`;
  cardElem.style.zIndex = 100 + newIndex;

  addCardToPile(toPile, cardElem, newIndex);
  setTimeout(onCardMovementComplete.bind(cardElem), moveDuration);

  return cardElem;
}

function onCardMovementComplete() {
  this.style.zIndex -= 100;
  this.classList.remove("flipping-up", "flipping-down");

  const i = drawing.indexOf(this);
  if (i > -1) drawing.splice(i, 1);

  if (pile.deck.cards.length == 0 && drawing.length == 0) {
    shuffleDiscardIntoDeck();
  }

  tryApplyTool(getTool(this.dataset));
}

function onDeckCardClick(mouseEvent: any) {
  if (pile.deck.cards.indexOf(this) > -1) {
    drawCard();
  }
}

function onProductClick(mouseEvent: any) {
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
      addCardToPile({ elem: protoCard }, newCard, 0);

      let targetPile = pile.discard;

      const toolPile = protoCard.dataset.value + "Slot";
      if (toolPile in pile) {
        targetPile = pile[toolPile];

        const nextTool = getTool(protoCard.dataset, 1);
        replaceProduct(this.parentElement, nextTool);
      }

      requestAnimationFrame(() => moveCard(newCard, targetPile));
    }
  }
}

function tryApplyTool(data: any) {
  if (data) {
    if (data.tool == "pickaxe") {
      clearInterval(pickaxeTimer);
      pickaxeTimer = setInterval(drawCard, data.timer * 1000);
      drawCard();
    } else if (data.tool == "cart") {
      // inventorySize += data.inventoryIncrease;
      updateResources();
    }
  }
}

function isAffordable(productElem: any) {
  const resource = productElem.dataset.resource;
  if (resource in resources) {
    return resources[resource] >= parseInt(productElem.dataset.cost);
  }
  return true; // must be free
}

function showDeckScreen() {
  deckScreenElem.style.display = "flex";

  const container = deckScreenElem.querySelector(".card-container");
  const cards = pile.deck.cards.concat(pile.discard.cards);

  for (let i = 0; i < cards.length; i++) {
    let clone = cards[i].cloneNode(true);
    clone.style.transform = null;
    clone.classList = "card";
    clone.onclick = onDestroyCardClick;
    container.appendChild(clone);
  }

  updateDeckScreen();
}

function updateDeckScreen() {
  if (deckScreenElem.style.display != "none") {
    const cost = getDestroyCost();
    deckScreenElem.querySelector(".resource-count").innerText = cost;
    deckScreenElem.classList.toggle("unaffordable", resources.tnt < cost);
  }
}

function onDestroyCardClick() {
  if (resources.tnt >= getDestroyCost()) {
    if (!tryRemoveCard(this.dataset, pile.deck)) {
      tryRemoveCard(this.dataset, pile.discard);
    }
    adjustResource("tnt", -getDestroyCost());
    this.classList.add("destroyed");
    this.onclick = null;
  }
}

function closeDeckScreen() {
  deckScreenElem.style.display = "none";

  const container = deckScreenElem.querySelector(".card-container");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function tryRemoveCard(data: any, pile: any) {
  for (let i = 0; i < pile.cards.length; i++) {
    let card = pile.cards[i];
    if (
      card.dataset.resource == data.resource &&
      card.dataset.value == data.value
    ) {
      card.parentElement.removeChild(card);
      pile.cards.splice(i, 1);
      return true;
    }
  }
  return false;
}

function updateBgColor() {
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

  gameElem.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function makeStartingDeck() {
  let deck: any[] = [];
  STARTING_DECK.forEach(function (c) {
    for (let n = 0; n < c.count; n++) {
      deck.push(createDeckCard(c.card));
    }
  });
  deck = shuffleCards(deck);

  for (let i = 0; i < deck.length; i++) {
    addCardToPile(pile.deck, deck[i], i);
    deck[i].style.zIndex = i;
    deck[i].classList.add("face-down");
  }
}

function createDeckCard(data: any) {
  // "stone 2"
  const cardElem = createCard(data);

  gameElem.appendChild(cardElem);
  //cardElem.onclick = onDeckCardClick;

  return cardElem;
}

function makeStore() {
  STORE_CONTENTS.forEach(function (c) {
    let product = createProduct(c);
    storeElem.appendChild(product);
    const e = product.querySelector(".buy-button");
    if (e) (e as any).onclick = onProductClick;
  });
}

function replaceProduct(productElem: any, data: any) {
  if (data == null) {
    productElem.classList.add("soldout");
    productElem.querySelector(`.buy-button`).onclick = null;
    return;
  }

  setProductData(productElem, data);

  const cards = productElem.querySelectorAll(".card");
  for (let i = 0; i < cards.length; i++) {
    setCard(cards[i], data.card);
  }

  const buyButton = productElem.querySelector(".buy-button");
  buyButton.innerHTML = getBuyButtonHTML(data.cost);

  productElem.classList.toggle("unaffordable", !isAffordable(productElem));
}

function createProduct(data: any) {
  // {card: "stone 3", cost: "stone 9"},
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

function setProductData(productElem: any, data: any) {
  productElem.dataset.card = data.card;
  productElem.dataset.ability = data.ability;

  if (data.cost) {
    const costParts = data.cost.split(" ");
    productElem.dataset.resource = costParts[0];
    productElem.dataset.cost = costParts[1];
  }
}

function getBuyButtonHTML(data: any) {
  const parts = data.split(" ");
  if (data) {
    return `
            <span class="resource-count">${parts[1]}</span>
            <div class="resource-icon ${parts[0]}"></div>
        `;
  } else {
    return `<span class="resource-count">Free</span>`;
  }
}

function createCard(data: any) {
  const cardElem = document.createElement("div");
  cardElem.classList.add("card");
  setCard(cardElem, data);
  return cardElem;
}

function setCard(cardElem: any, data: any) {
  let parts = data.split(" ");
  let resource = parts[0];
  let value = parts[1];
  cardElem.innerHTML = getCardHTML(resource, value);
  cardElem.dataset.resource = resource;
  cardElem.dataset.value = value;
}

function getCardHTML(resource: any, value: any) {
  let contentHTML = "";
  let topHTML = "";
  let bottomHTML = "";

  if (resource == "stairs" || resource == "upgrade") {
    topHTML = `<span class="name label">${resource}</span>`;
    bottomHTML =
      resource == "stairs"
        ? `<div class="description label">Descend one level deeper.</div>`
        : `<div class="description label">Upgrade a resource card.</div>`;
  } else if (isNaN(parseInt(value))) {
    topHTML = `<span class="name label">${resource} ${value}</span>`;
    const timer = getTool({ resource: resource, value: value }).timer;
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

const STARTING_DECK = [
  { card: "stone 1", count: 8 },
  { card: "stairs 1", count: 1 },
];

const STORE_CONTENTS = [
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

const TOOLS: any = {
  pickaxe: [
    { card: "old pickaxe", timer: 1.5 },
    { card: "stone pickaxe", cost: "stone 15", timer: 1.25 },
    { card: "iron pickaxe", cost: "iron 15", timer: 1 },
    { card: "diamond pickaxe", cost: "diamond 15", timer: 0.5 },
  ],
  cart: [{ card: "stone cart", cost: "stone 10", inventoryIncrease: 5 }],
};

function getTool(data: any, offset = 0) {
  if (data.value in TOOLS) {
    for (let i = 0; i < TOOLS[data.value].length; i++) {
      if (TOOLS[data.value][i].card.startsWith(data.resource)) {
        let toolData = TOOLS[data.value][i + offset];
        if (toolData) toolData.tool = data.value;
        return toolData;
      }
    }
  }
}

function getDestroyCost() {
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
