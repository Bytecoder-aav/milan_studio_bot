(function () {
  'use strict';

  // ----- Gallery images: додайте URL фото для портфоліо -----
  const galleryImages = [
    // Приклад: '/images/portfolio-1.jpg', '/images/portfolio-2.jpg', ...
    'images/portfolio-1.jpg',
    'images/portfolio-2.jpg',
    'images/portfolio-4.jpg',    
    'images/portfolio-3.jpg',
    'images/portfolio-5.jpg',
    'images/portfolio-6.jpg',
  ];

  // ----- Price images: прайси салону -----
  const priceImages = [
    { src: 'images/prices/price-hair-1.jpg', alt: 'Прайс-лист: волосся (топ-майстер)' },
    { src: 'images/prices/price-hair-2.jpg', alt: 'Прайс-лист: волосся (1)' },
    { src: 'images/prices/price-hair-2 (2).jpg', alt: 'Прайс-лист: волосся (2)' },
    { src: 'images/prices/price-brows-lashes.jpg', alt: 'Прайс-лист: брови / вії' },
    { src: 'images/prices/price-permanent.jpg', alt: 'Прайс-лист: перманентний макіяж' },
    { src: 'images/prices/price-manicure-1.jpg', alt: 'Прайс-лист: манікюр' },
    { src: 'images/prices/price-manicure-2.jpg', alt: 'Прайс-лист: манікюр (Аліна Дорошенко)' },
    { src: 'images/prices/price-massage.jpg', alt: 'Прайс-лист: масаж' },

  ];

  // ----- Scroll-triggered animations -----
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px', // Змінено для швидшого спрацювання на iOS
    threshold: 0.05
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));

  // ----- Header scroll state -----
  const header = document.querySelector('.header');
  if (header) {
    const handleScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ----- Floating booking button: hidden on hero & contact -----
  const floatingBooking = document.getElementById('floating-booking');
  const heroSection = document.querySelector('.hero');
  const contactSection = document.getElementById('contact');

  if (floatingBooking && (heroSection || contactSection)) {
    const visibility = { hero: false, contact: false };

    const updateFloatingBooking = () => {
      const shouldHide = visibility.hero || visibility.contact;
      floatingBooking.hidden = shouldHide;
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroSection) visibility.hero = entry.isIntersecting;
          if (entry.target === contactSection) visibility.contact = entry.isIntersecting;
        });
        updateFloatingBooking();
      },
      { threshold: 0.35 }
    );

    if (heroSection) io.observe(heroSection);
    if (contactSection) io.observe(contactSection);

    updateFloatingBooking();
  }

  // ----- Mobile menu -----
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // ----- Services Price Data -----
  const servicesData = {
    hair: {
      title: 'Перукар/Колорист',
      masters: [
        { name: 'Лена', role: 'Майстер', photo: 'images/team/lena.jpg' },   
      ],
      prices: [
        { name: 'Стрижка', isHeader: true },
        { name: 'Густе/довге волосся', master: '900 ₴' },
        { name: 'Середня довжина', master: '800 ₴' },
        { name: 'Догляд', isHeader: true },
        { name: 'Bright + Olaplex', master: '2000-2300 ₴' },
        { name: 'Реконструкція', master: '2300 ₴' },
        { name: 'Реконструкція (Довге/густе)', master: '2700 ₴' },
        { name: 'Тонування & Фарбування', isHeader: true },
        { name: 'Тонування Color Touch', master: '2200-2800 ₴' },
        { name: 'Фарбування Koleston Perfect', master: '2400-3000 ₴' },
        { name: 'Фарбування Illumina', master: '2500-3200 ₴' },
        { name: 'Total Blonde', master: '2500-3500 ₴' },
        { name: 'Додатково враховується до процедур та фарбування', isHeader: true },
        { name: 'Контуринг', master: 'від 4800 ₴' },
        { name: 'Мелірування', master: 'від 4500 ₴' },
        { name: 'Балаяж', master: 'від 5000 ₴' },
        { name: 'Аїртач', master: 'від 7000 ₴' }
      ]
    },
    colorist: {
      title: 'Перукар/Колорист',
      masters: [
        { name: 'Альона', role: 'Майстер', photo: 'images/team/alona.jpg' },
        { name: 'Віта', role: 'Топ-майстер', photo: 'images/team/vita.jpg' }
      ],
      prices: [
        { name: 'Стрижка', isHeader: true },
        { name: 'Стрижка дівчат до 10 років', master: '250 ₴', top: '250 ₴' },
        { name: 'Підліткова (від 10 років)', master: '350 ₴', top: '350 ₴' },
        { name: 'Підліткова з миттям волосся', master: '500 / 600 ₴', top: '500 / 600 ₴' },
        { name: 'Стрижка чубчика', master: '150 ₴', top: '150 ₴' },
        { name: 'Чоловіча стрижка', master: '400 ₴', top: '400 ₴' },
        { name: 'Стрижка бороди', master: '50 / 100 ₴', top: '50 / 100 ₴' },
        { name: 'Стрижка хлопчиків до 10 років', master: '250 ₴', top: '250 ₴' },
        { name: 'Зачіски', isHeader: true },
        { name: 'Миття + укладка', master: '450 - 500 ₴', top: '450 - 500 ₴' },
        { name: 'Накрутка', master: '500 - 700 ₴', top: '500 - 700 ₴' },
        { name: 'Зачіска', master: '700 - 1000 ₴', top: '700 - 1000 ₴' },
        { name: 'Фарбування (Wella Koleston + Color Touch)', isHeader: true },
        { name: 'Фарбування коренів', master: '1600 / 2000 ₴', top: '1600 / 2000 ₴' },
        { name: 'Корінь + довжина', master: '1800 / 2500 ₴', top: '1800 / 2500 ₴' },
        { name: 'Корінь + стрижка', master: '1800 / 2300 ₴', top: '1800 / 2300 ₴' },
        { name: 'Корінь + довжина + стрижка', master: '2000 / 2700 ₴', top: '2000 / 2700 ₴' }
      ]
    },
    permanent: {
      title: 'Перманент / Ремувер',
      masters: [
        { name: 'Олеся', role: 'Топ-майстер', photo: 'images/team/olesya.jpg' }
      ],
      prices: [
        { name: 'Перманент', isHeader: true },
        { name: 'Брови', top: '3000 ₴' },
        { name: 'Губи', top: '3300 ₴' },
        { name: 'Волоскова техніка', top: '4000 ₴' },
        { name: 'Міжвійка', top: '2500 ₴' },
        { name: 'Ремувер', top: '750 ₴' },
        { name: 'Ламінування', top: '600 ₴' },
        { name: 'Корекції (від 1-2 місяці)', isHeader: true },
        { name: 'Брови', top: '2000 ₴' },
        { name: 'Губи', top: '2300 ₴' },
        { name: 'Волоскова техніка', top: '2500 ₴' }
      ]
    },
    nails: {
      title: 'Нігтьовий сервіс',
      masters: [
        { name: 'Аліна Дорошенко', role: 'Майстер', photo: 'images/team/alinad.jpg' },
        { name: 'Аліна', role: 'Топ-майстер', photo: 'images/team/alina.jpg' }
      ],
      prices: [
        { name: 'Комплекс (зняття, манікюр, покриття)', master: '500', top: '550' },
        { name: 'Манікюр без покриття', master: '300', top: '300' },
        { name: 'Повне зняття матеріалу', master: '100', top: '100' },
        { name: 'Ремонт нігтів', master: '30 - 50', top: '30 - 50' },
        { name: 'Укріплення', master: '+50', top: '+50' }, 
        { name: 'Френч', master: '+50', top: '+50' } 
      ]
    },
    brows: {
      title: 'Бровіст / Ламімейкер',
      masters: [
        { name: 'Віта', role: 'Майстер', photo: 'images/team/vita.jpg' },
      ],
      prices: [
        { name: 'Ламінування вій', master: '650 ₴' },
        { name: 'Ламінування брів', master: '600 ₴' },
        { name: 'Оформлення брів', master: '400 ₴' },
        { name: 'Корекція брів', master: '250 ₴' },
        { name: 'Ботокс для вій/брів', master: '100 ₴' },
        { name: 'Видалення волосся (1 зона: над губою, у носі / підборіддя)', master: '100 ₴' }
      ]
    },
    massage: {
      title: 'Масажист',
      masters: [
        { name: 'Ольга', role: 'Майстер', photo: 'images/team/olga.jpg' }
      ],
      prices: [
        { name: 'Масаж', isHeader: true },
        { name: '- шийно-комірцевої зони', master: '450 - 500 ₴' },
        { name: '- спини', master: '500 - 550 ₴' },
        { name: '- всього тіла', master: '1000 ₴' },
        { name: '- рук', master: '750 ₴' },
        { name: '- ніг', master: '450 ₴' },
        { name: '- живота', master: '500 ₴' },
        { name: '', isHeader: true },
        { name: 'Пресотерапія', master: '450' },
        { name: 'Медовий масаж', master: '600 ₴' },
        { name: 'Масаж гарячими апельсинами', master: '600 ₴' },
        { name: 'Пропрацювання масажним пістолетом окрему зону', master: '50 ₴' }
      ]
    }
  };

  // ----- Price Modal Logic -----
  const priceModal = document.getElementById('price-modal');
  const modalTitle = document.getElementById('modal-category-title');
  const modalBody = document.getElementById('modal-price-body');
  const priceModalClose = document.querySelector('.price-modal-close');
  const modalBookingBtn = document.querySelector('.price-modal-btn');
  const modalTableHead = priceModal?.querySelector('thead tr');

  function openPriceModal(serviceKey) {
    const data = servicesData[serviceKey];
    if (!data || !priceModal || !modalBody || !modalTableHead) return;

    modalTitle.textContent = data.title;
    modalBody.innerHTML = '';

    // Determine which price columns to show based on the masters array
    const showMasterCol = data.masters.some(m => m.role === 'Майстер');
    const showTopCol = data.masters.some(m => m.role === 'Топ-майстер');

    // Build the header dynamically
    let headHtml = `<th class="price-header-name">Послуги</th>`;
    
    if (showMasterCol) {
      const master = data.masters.find(m => m.role === 'Майстер');
      headHtml += `
        <th class="price-header-val badge-master">
          <div class="master-badge-item">
            <div class="master-photo-circle">
              <img src="${master.photo || 'images/founder.jpg'}" alt="${master.name}" class="master-photo">
            </div>
            <span class="price-badge">${master.name}</span>
          </div>
        </th>`;
    }

    if (showTopCol) {
      const topMaster = data.masters.find(m => m.role === 'Топ-майстер');
      headHtml += `
        <th class="price-header-val badge-top-master">
          <div class="master-badge-item">
            <div class="master-photo-circle">
              <img src="${topMaster.photo || 'images/founder.jpg'}" alt="${topMaster.name}" class="master-photo">
            </div>
            <span class="price-badge">${topMaster.name}</span>
          </div>
        </th>`;
    }

    modalTableHead.innerHTML = headHtml;

    // Toggle single column class for styling
    if (!showMasterCol || !showTopCol) {
      priceModal.classList.add('single-column');
    } else {
      priceModal.classList.remove('single-column');
    }

    // Build the rows
    data.prices.forEach(item => {
      const row = document.createElement('tr');
      
      if (item.isHeader) {
        row.className = 'price-section-row';
        const cols = 1 + (showMasterCol ? 1 : 0) + (showTopCol ? 1 : 0);
        row.innerHTML = `<td colspan="${cols}" class="price-section-title">${item.name}</td>`;
      } else {
        row.className = 'price-row';
        let html = `<td class="price-name">${item.name}</td>`;
        
        if (showMasterCol) {
          html += `<td class="price-val">${item.master || '-'}</td>`;
        }
        
        if (showTopCol) {
          html += `<td class="price-val">${item.top || '-'}</td>`;
        }
        
        row.innerHTML = html;
      }
      
      modalBody.appendChild(row);
    });

    priceModal.hidden = false;
    priceModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePriceModal() {
    if (!priceModal) return;
    priceModal.classList.remove('is-open');
    setTimeout(() => {
      priceModal.hidden = true;
    }, 400);
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      const serviceKey = card.getAttribute('data-service');
      if (serviceKey) openPriceModal(serviceKey);
    });
  });

  if (priceModalClose) {
    priceModalClose.addEventListener('click', closePriceModal);
  }

  if (modalBookingBtn) {
    modalBookingBtn.addEventListener('click', (e) => {
      // Плавний перехід до секції контакту вже обробляється іншим скриптом,
      // тут ми просто закриваємо модальне вікно.
      closePriceModal();
    });
  }

  if (priceModal) {
    priceModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('price-modal-overlay')) closePriceModal();
    });
  }

  // ----- Gallery: підстановка зображень та lightbox -----
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  let isPriceMode = false;
  let currentImageIndex = 0;
  let activeImageArray = [];

  function updateLightboxNav() {
    if (!lightboxPrev || !lightboxNext) return;
    const show = isPriceMode && activeImageArray.length > 1;
    lightboxPrev.style.display = show ? 'flex' : 'none';
    lightboxNext.style.display = show ? 'flex' : 'none';
  }

  function openLightbox(index, mode = 'gallery') {
    if (!lightbox || !lightboxImg) return;

    if (mode === 'price') {
      isPriceMode = true;
      activeImageArray = priceImages;
    } else {
      isPriceMode = false;
      activeImageArray = galleryImages.map((src, i) => ({
        src,
        alt: 'Робота студії ' + (i + 1)
      }));
    }

    currentImageIndex = index;
    const item = activeImageArray[currentImageIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;

    updateLightboxNav();
    lightbox.hidden = false;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    isPriceMode = false;
    activeImageArray = [];
    updateLightboxNav();
    lightbox.classList.remove('is-open');
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function showNextImage(delta) {
    if (!activeImageArray.length || !lightboxImg) return;
    const total = activeImageArray.length;
    currentImageIndex = (currentImageIndex + delta + total) % total;
    const item = activeImageArray[currentImageIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
  }

  galleryItems.forEach((item, i) => {
    const imgUrl = galleryImages[i];
    if (imgUrl) {
      item.innerHTML = '';
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = 'Робота студії ' + (i + 1);
      img.loading = 'lazy';
      item.appendChild(img);
    }

    item.addEventListener('click', () => {
      openLightbox(i, 'gallery');
    });
  });

  // ----- Price list viewer: єдина кнопка під послугами -----
  const pricesButton = document.querySelector('.btn-prices');
  if (pricesButton && priceImages.length) {
    pricesButton.addEventListener('click', () => {
      openLightbox(0, 'price');
    });
  }

  // ----- Lightbox Swipe Handling -----
  let touchStartX = 0;
  let touchEndX = 0;

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      showNextImage(1);
    } else if (touchEndX > touchStartX + swipeThreshold) {
      showNextImage(-1);
    }
  }

  if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (activeImageArray.length > 1) handleSwipe();
    }, { passive: true });
  }

  if (lightboxPrev && lightboxNext) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      showNextImage(-1);
    });
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      showNextImage(1);
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-content')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      } else if (activeImageArray.length > 1 && e.key === 'ArrowRight') {
        showNextImage(1);
      } else if (activeImageArray.length > 1 && e.key === 'ArrowLeft') {
        showNextImage(-1);
      }
    });
  }

  // ----- Google reviews (static placeholder; підключіть API пізніше) -----
  const googleReviewsData = [
    {
      author: 'Анна',
      rating: 5,
      text: 'Крім смачної кави, ви можете побувати у професійного жіночого майстра та крутого Барбера 🤘 кращі майстри з манікюру та ламінації вій, так само чекають на вас 😘❤️ А приємна атмосфера салону нікого не залишає байдужим, всі хочуть повертатися туди знову і знову.'
    },
    {
      author: 'Оксана',
      rating: 5,
      text: 'Атмосфера дуже класна.'
    },
    {
      author: 'Ірія',
      rating: 5,
      text: 'Без коментарів'
    }
  ];

  const googleReviewsContainer = document.getElementById('google-reviews');

  if (googleReviewsContainer && Array.isArray(googleReviewsData)) {
    googleReviewsData.forEach((review) => {
      const card = document.createElement('article');
      card.className = 'review-card animate-on-scroll';

      const ratingEl = document.createElement('div');
      ratingEl.className = 'review-rating';

      const stars = document.createElement('span');
      stars.textContent = '★★★★★'.slice(0, review.rating);
      ratingEl.appendChild(stars);

      const label = document.createElement('small');
      label.textContent = review.rating.toFixed(1);
      ratingEl.appendChild(label);

      const textEl = document.createElement('p');
      textEl.className = 'review-text';
      textEl.textContent = review.text;

      const authorEl = document.createElement('footer');
      authorEl.className = 'review-author';
      authorEl.textContent = '— ' + review.author;

      card.appendChild(ratingEl);
      card.appendChild(textEl);
      card.appendChild(authorEl);

      googleReviewsContainer.appendChild(card);
      observer.observe(card);
    });
  }

  // ----- Custom Select Handling -----
  const customSelect = document.getElementById('custom-service-select');
  if (customSelect) {
    const trigger = customSelect.querySelector('.select-trigger');
    const optionsContainer = customSelect.querySelector('.select-options');
    const options = customSelect.querySelectorAll('.select-option');
    const nativeSelect = customSelect.querySelector('select');
    const valueDisplay = customSelect.querySelector('.select-value');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      customSelect.classList.toggle('active');
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');
        const text = option.textContent.trim();

        // Update display
        valueDisplay.textContent = text;
        if (value === "") {
          valueDisplay.classList.add('is-placeholder');
        } else {
          valueDisplay.classList.remove('is-placeholder');
        }
        
        // Update native select
        nativeSelect.value = value;
        
        // Update active state in list
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Close dropdown
        customSelect.classList.remove('active');
        
        // Trigger change event on native select if needed
        nativeSelect.dispatchEvent(new Event('change'));
      });
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
      customSelect.classList.remove('active');
    });
  }

  // ----- Contact form -----
  const API_URL = "https://milanstudiobot-production.up.railway.app/api";
  const API_KEY = "lena7777";

  const form = document.getElementById('contact-form');
  const messageEl = document.getElementById('form-message');

  // Мінімальна дата — сьогодні
  const dateInput = document.getElementById('date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = 'form-message visible ' + type;
    messageEl.setAttribute('aria-live', 'polite');
    setTimeout(() => {
      messageEl.classList.remove('visible');
    }, 7000);
  }

  async function sendBooking(formData) {
    const response = await fetch(`${API_URL}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        name:           formData.name,
        phone:          formData.phone,
        service:        formData.service,
        date:           formData.date || '',
        time:           formData.time || '',
        comment:        formData.comment || '',
        contact_method: formData.contact_method,
      })
    });
    return await response.json();
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Читаємо спосіб зв'язку — radio name="contactMethod"
      const contactMethodEl = form.querySelector('[name="contactMethod"]:checked');
      const contactMethod = contactMethodEl ? contactMethodEl.value : 'phone';

      const contactText = contactMethod === 'telegram'
        ? 'Ми напишемо вам у Telegram найближчим часом. 📩'
        : 'Ми зателефонуємо вам у найближчий робочий час. 📞';

      // Блокуємо кнопку щоб не відправити двічі
      const submitBtn = form.querySelector('[type="submit"]');
      const submitSpan = submitBtn ? submitBtn.querySelector('span') : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitSpan) submitSpan.textContent = 'Відправляємо...';
      }

      try {
        const result = await sendBooking({
          name:           form.querySelector('#name')?.value.trim() || '',
          phone:          form.querySelector('#phone')?.value.trim() || '',
          service:        form.querySelector('#service')?.value || '',
          date:           form.querySelector('#date')?.value || '',
          time:           form.querySelector('#time')?.value || '',
          comment:        form.querySelector('#comment')?.value.trim() || '',
          contact_method: contactMethod,
        });

        if (result.success) {
          showMessage('✅ Дякуємо! ' + contactText, 'success');
          form.reset();
          // Скидаємо кастомний select
          const valueDisplay = document.querySelector('.select-value');
          if (valueDisplay) {
            valueDisplay.textContent = 'Оберіть послугу';
            valueDisplay.classList.add('is-placeholder');
          }
          // Оновлюємо мін дату після reset
          if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
        } else {
          showMessage('❌ ' + (result.error || 'Помилка. Спробуйте ще раз.'), 'error');
        }
      } catch (err) {
        showMessage('❌ Не вдалось відправити. Перевірте інтернет та спробуйте ще раз.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitSpan) submitSpan.textContent = 'Надіслати';
        }
      }
    });
  }

  // ----- Smooth scroll for anchor links -----
  document.querySelectorAll('a[href^="#"], .logo, .footer-logo').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href') || '#hero'; // Логотипи ведуть на початок
      if (href === '#') return;
      
      const target = document.querySelector(href === '#hero' ? '.hero' : href);
      if (target) {
        e.preventDefault();
        
        // Закриваємо мобільне меню, якщо воно відкрите
        if (nav && burger && nav.classList.contains('open')) {
          nav.classList.remove('open');
          burger.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('menu-open');
        }

        // Для iOS краще використовувати setTimeout, щоб дати браузеру час обробити закриття меню
        setTimeout(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 10);
      }
    });
  });
})();
