const parent = document.querySelector(".grid-container")

fetch("/getImages")
  .then((response) => response.json())
  .then((data) => {
    for (let i = 0; i < data.length; i++) {
      const newImageCard = document.createElement("div");
      console.log(data[i]);
      newImageCard.className = "grid-item";
      newImageCard.innerHTML = `
        <img class="image-item" src="/getImage/${data[i]}">
        <button class="download"></button>
        <button class="share"></button>
        <h1 class="image-name">${data[i]}</h1>
      `;
      parent.appendChild(newImageCard);
    }
  });
