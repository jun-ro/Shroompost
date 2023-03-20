const parent = document.querySelector('.grid-container');

async function getVideoNames() {
  const response = await fetch('/getVideos');
  const data = await response.json();
  return data;
}

function loadVideos() {
  getVideoNames().then(videoNames => {
    for (let i = 0; i < videoNames.length; i++) {
      const videoName = videoNames[i].split('.')[0];
      const newVideoCard = document.createElement('div');
      newVideoCard.className = 'grid-item';
      newVideoCard.innerHTML = `
        <video class="video-item" controls="true" data-src="/getVideo/${videoNames[i]}" preload="none"></video>
        <button class="download"></button>
        <button class="share"></button>
        <h1 class="video-name">${videoName}</h1>
      `;
      parent.appendChild(newVideoCard);
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target
          console.log(entry)
          video.src = video.dataset.src;
          video.load();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    const videos = document.querySelectorAll('video[data-src]');
    videos.forEach(video => observer.observe(video));
  });
}

window.addEventListener('DOMContentLoaded', loadVideos);