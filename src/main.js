// CSS imported via link tag in index.html
import Game from './Game.js'

const initApp = () => {
  const game = new Game();
  console.log('Game initialized');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
