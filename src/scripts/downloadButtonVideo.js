import { Butler } from "./modules/Butler.js";

const Wait = new Butler();

document.addEventListener("DOMContentLoaded", async () => {
  await Wait.wait(0.1);
  const download_buttons = document.querySelectorAll(".download");
  console.log(download_buttons);
  for (const download_button of download_buttons) {
    const parent = download_button.parentNode;
    const video_item = parent.querySelector(".video-item");
    if (video_item) {
      download_button.addEventListener("click", async function (event) {
        window.location.href = window.location.origin+`/download/${video_item.src.split('/').pop()}`
      })
    }
  }
});
