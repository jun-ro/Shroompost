import { Butler } from "./modules/Butler.js";

const Wait = new Butler();

document.addEventListener("DOMContentLoaded", async () => {
  await Wait.wait(0.1);
  const download_buttons = document.querySelectorAll(".download");
  console.log(download_buttons);
  for (const download_button of download_buttons) {
    const parent = download_button.parentNode;
    const image_item = parent.querySelector(".image-item");
    if (image_item) {
      download_button.addEventListener("click", async function (event) {
        window.location.href = window.location.origin+`/download/${image_item.src.split('/').pop()}`
      })
    }
  }
});
