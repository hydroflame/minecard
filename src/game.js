let pile = {
  deck: { cards: [] },
  discard: { cards: [] },
  pickaxeSlot: { cards: [] },
  cartSlot: { cards: [] },
};

let drawing = [];

let gameElem;
let gameRect;
let storeElem;
let deckScreenElem;

let pickaxeTimer;

let resources = { stone: 0, iron: 0, diamond: 0, tnt: 0, stairs: 0 };

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
    elem.querySelector(".current").innerText = resources[resource];
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

function shuffleCards(cardElems) {
  const shuffledCards = [];
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

function applyCard(card) {
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

function adjustResource(resource, value) {
  const count = parseInt(value);
  if (resource in resources && !isNaN(count)) {
    const max = resource == "stairs" ? MAX_LEVEL : MAX_INVENTORY;
    resources[resource] = Math.max(
      0,
      Math.min(resources[resource] + count, max)
    );

    updateResources();

    if (resource == "stairs" && resources.stairs == MAX_LEVEL) {
      document.getElementById("victory").style.display = "block";
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

function addCardToPile(pile, cardElem, index) {
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

function getOffset(index) {
  return {
    x: Math.random() * 4 - 2,
    y: index * -2 + (Math.random() - 0.5),
    r: Math.random() * 4 - 2,
  };
}

function moveCard(cardElem, toPile) {
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

function onDeckCardClick(mouseEvent) {
  if (pile.deck.cards.indexOf(this) > -1) {
    drawCard();
  }
}

function onProductClick(mouseEvent) {
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

      targetPile = pile.discard;

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

function tryApplyTool(data) {
  if (data) {
    if (data.tool == "pickaxe") {
      clearInterval(pickaxeTimer);
      pickaxeTimer = setInterval(drawCard, data.timer * 1000);
      drawCard();
    } else if (data.tool == "cart") {
      inventorySize += data.inventoryIncrease;
      updateResources();
    }
  }
}

function isAffordable(productElem) {
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

function tryRemoveCard(data, pile) {
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
