import { Butler } from "./modules/Butler.js";

const Wait = new Butler();

document.addEventListener("DOMContentLoaded", async () => {
  await Wait.wait(0.1);
  const share_buttons = document.querySelectorAll(".share");
  const alert = document.querySelector(".misc-wrapper");
  console.log(share_buttons);
  for (const share_button of share_buttons) {
    const parent = share_button.parentNode;
    const image_item = parent.querySelector(".image-item");
    if (image_item) {
      share_button.addEventListener("click", async function (event) {
        alert.classList.add("show")
        navigator.clipboard
          .writeText(image_item.src)
          .then(() => {
            console.log(
              `${image_item.src} Has been copied to User's clipboard`
            );
          })
          .catch((error) => {
            console.error("Error copying text to clipboard:", error);
          });
          await Wait.wait(1)
          alert.classList.remove("show");
      });
    } else {
      console.log("image Element does not Exist");
    }
  }
});
