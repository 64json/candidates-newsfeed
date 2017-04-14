module.exports = {
  shuffle: (array) => {
    const randomized = [];
    for (let i = array.length - 1; i >= 0; i--) {
      randomized.push(...array.splice(Math.random() * i | 0, 1));
    }
    return randomized;
  },

  stripTags: (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const imgs = div.getElementsByTagName('img');
    const image = imgs[0] && imgs[0].src;
    const text = (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    return { image, text };
  }
};