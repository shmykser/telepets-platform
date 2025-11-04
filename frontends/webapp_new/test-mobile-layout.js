// Скрипт для тестирования мобильной верстки на разных размерах экранов
// Запускать в консоли браузера или через Chrome DevTools

const testSizes = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Galaxy S20 Ultra', width: 412, height: 915 }
];

function checkLayout() {
  const body = document.body;
  const html = document.documentElement;
  
  const results = {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    overflow: {
      bodyOverflowX: window.getComputedStyle(body).overflowX,
      htmlOverflowX: window.getComputedStyle(html).overflowX,
      hasHorizontalScroll: body.scrollWidth > body.clientWidth || html.scrollWidth > html.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth
    },
    statsAndButton: (() => {
      const container = Array.from(document.querySelectorAll('div')).find(div => 
        Array.from(div.children).some(child => 
          child.className && child.className.includes('w-1/2')
        )
      );
      
      if (!container) return null;
      
      const children = Array.from(container.children);
      const statsBlock = children.find(c => c.querySelector('[class*="grid-cols-2"]'));
      const buttonBlock = children.find(c => c.querySelector('button'));
      
      return {
        containerWidth: container.offsetWidth,
        statsBlockWidth: statsBlock?.offsetWidth || 0,
        buttonBlockWidth: buttonBlock?.offsetWidth || 0,
        isCorrect: statsBlock && buttonBlock && 
          Math.abs(statsBlock.offsetWidth - container.offsetWidth / 2) < 5 &&
          Math.abs(buttonBlock.offsetWidth - container.offsetWidth / 2) < 5
      };
    })(),
    carousel: (() => {
      const carousel = Array.from(document.querySelectorAll('div')).find(div => 
        div.querySelector('img[alt]') && 
        (window.getComputedStyle(div).overflow === 'hidden' || div.className.includes('overflow-x-hidden'))
      );
      
      if (!carousel) return null;
      
      return {
        width: carousel.offsetWidth,
        scrollWidth: carousel.scrollWidth,
        isOverflowing: carousel.scrollWidth > carousel.offsetWidth,
        overflow: window.getComputedStyle(carousel).overflow
      };
    })(),
    dock: (() => {
      const dock = document.querySelector('.dock-container');
      
      if (!dock) return null;
      
      const styles = window.getComputedStyle(dock);
      return {
        position: styles.position,
        bottom: dock.style.bottom || styles.bottom,
        left: dock.style.left || styles.left,
        transform: dock.style.transform,
        offsetLeft: dock.offsetLeft,
        width: dock.offsetWidth,
        isOverflowing: dock.scrollWidth > dock.offsetWidth
      };
    })()
  };
  
  return results;
}

// Запустить тестирование
console.log('=== Тестирование мобильной верстки ===');
console.log('Текущий размер:', window.innerWidth + 'x' + window.innerHeight);
console.log('Результаты:', checkLayout());

// Для тестирования на разных размерах используйте Chrome DevTools Device Emulation

