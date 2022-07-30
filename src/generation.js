function makeStartingDeck() {
  let deck = [];
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

function createDeckCard(data) {
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
    product.querySelector(".buy-button").onclick = onProductClick;
  });
}

function replaceProduct(productElem, data) {
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

function createProduct(data) {
  // {card: "stone 3", cost: "stone 9"},
  const productElem = document.createElement("div");
  productElem.classList.add("product");

  setProductData(productElem, data);

  if (data.card) {
    for (let i = 0; i < 3; i++) {
      const cardElem = createCard(data.card);
      const o = getOffset(i);
      cardElem.style.transform = `translate(${o.x}px, ${o.y}px) rotate(${o.r}deg)`;
      cardElem.style.zIndex = i;
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

function setProductData(productElem, data) {
  productElem.dataset.card = data.card;
  productElem.dataset.ability = data.ability;

  if (data.cost) {
    const costParts = data.cost.split(" ");
    productElem.dataset.resource = costParts[0];
    productElem.dataset.cost = costParts[1];
  }
}

function getBuyButtonHTML(data) {
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

function createCard(data) {
  const cardElem = document.createElement("div");
  cardElem.classList.add("card");
  setCard(cardElem, data);
  return cardElem;
}

function setCard(cardElem, data) {
  let parts = data.split(" ");
  let resource = parts[0];
  let value = parts[1];
  cardElem.innerHTML = getCardHTML(resource, value);
  cardElem.dataset.resource = resource;
  cardElem.dataset.value = value;
}

function getCardHTML(resource, value) {
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
