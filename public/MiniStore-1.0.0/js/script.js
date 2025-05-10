(function($) {

    "use strict";

    var searchPopup = function() {
      // open search box
      $('#header-nav').on('click', '.search-button', function(e) {
        $('.search-popup').toggleClass('is-visible');
      });

      $('#header-nav').on('click', '.btn-close-search', function(e) {
        $('.search-popup').toggleClass('is-visible');
      });
      
      $(".search-popup-trigger").on("click", function(b) {
          b.preventDefault();
          $(".search-popup").addClass("is-visible"),
          setTimeout(function() {
              $(".search-popup").find("#search-popup").focus()
          }, 350)
      }),
      $(".search-popup").on("click", function(b) {
          ($(b.target).is(".search-popup-close") || $(b.target).is(".search-popup-close svg") || $(b.target).is(".search-popup-close path") || $(b.target).is(".search-popup")) && (b.preventDefault(),
          $(this).removeClass("is-visible"))
      }),
      $(document).keyup(function(b) {
          "27" === b.which && $(".search-popup").removeClass("is-visible")
      })
    }

    var initProductQty = function(){

      $('.product-qty').each(function(){

        var $el_product = $(this);
        var quantity = 0;

        $el_product.find('.quantity-right-plus').click(function(e){
            e.preventDefault();
            var quantity = parseInt($el_product.find('#quantity').val());
            $el_product.find('#quantity').val(quantity + 1);
        });

        $el_product.find('.quantity-left-minus').click(function(e){
            e.preventDefault();
            var quantity = parseInt($el_product.find('#quantity').val());
            if(quantity>0){
              $el_product.find('#quantity').val(quantity - 1);
            }
        });

      });

    }

    $(document).ready(function() {

      searchPopup();
      initProductQty();

      var swiper = new Swiper(".main-swiper", {
        speed: 500,
        navigation: {
          nextEl: ".swiper-arrow-prev",
          prevEl: ".swiper-arrow-next",
        },
      });         

      var swiper = new Swiper(".product-swiper", {
        slidesPerView: 4,
        spaceBetween: 10,
        pagination: {
          el: "#mobile-products .swiper-pagination",
          clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          980: {
            slidesPerView: 4,
            spaceBetween: 20,
          }
        },
      });      

      var swiper = new Swiper(".product-watch-swiper", {
        slidesPerView: 4,
        spaceBetween: 10,
        pagination: {
          el: "#smart-watches .swiper-pagination",
          clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          980: {
            slidesPerView: 4,
            spaceBetween: 20,
          }
        },
      }); 

      var swiper = new Swiper(".testimonial-swiper", {
        loop: true,
        navigation: {
          nextEl: ".swiper-arrow-prev",
          prevEl: ".swiper-arrow-next",
        },
      }); 

    }); // End of a document ready

})(jQuery);

fetch('https://parallel-backend-production.up.railway.app/items')
  .then(res => res.json())
  .then(data => {
    try {
      document.getElementById('loader').style.display = 'flex';
      const items = data.items;
      const container = document.getElementById('products-container');

      // Group items by category_id
      const grouped = {};
      for (const item of items) {
        if (!grouped[item.category_id]) {
          grouped[item.category_id] = {
            category_name: item.main_cat_name || `Category ${item.category_id}`, 
            items: [],
          };
        }
        grouped[item.category_id].items.push(item);
      }

      // For each category, build a product section
      for (const catId in grouped) {
        const category = grouped[catId];
        const section = document.createElement('section');
        section.classList.add('product-section');

        section.innerHTML = `
          <div class="container">
            <div class="row">
              <div class="display-header d-flex justify-content-between pb-3">
                <h2 class="display-7 text-dark text-uppercase">${category.category_name} (${category.items[0].sub_cat_name}) </h2>
                <div class="btn-right">
                  <a href="shoppingPage.html" class="btn btn-medium btn-normal text-uppercase">Go to Shop</a>
                </div>
              </div>
              <div class="swiper product-swiper">
                <div class="swiper-wrapper">
                  ${category.items.map(item => {
                    return `
                      <div class="swiper-slide">
                        <div class="product-card position-relative">
                          <div class="image-holder">
                            <img src="${item.image}" alt="${item.name}" class="img-fluid" onerror="this.onerror=null;this.src='/images/a1.JPG';">
                          </div>
                          <div class="cart-concern position-absolute">
                            <div class="cart-button d-flex">
                            </div>
                          </div>
                          <div class="card-detail pt-3">
                            <h3 class="card-title text-uppercase"><a href="#">${item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name}</a></h3>
                            <span class="item-price text-primary d-block">$${item.actual_price}</span>
                            <span class="item-price text-primary d-block">Rated: ${item.rating ? item.rating : "No Rating"}</span>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
                <div class="swiper-pagination position-absolute text-center"></div>
              </div>
            </div>
          </div>
        `;

        container.appendChild(section);
      }

      // Initialize Swiper for all sections
      document.querySelectorAll('.product-swiper').forEach(swiperEl => {
        new Swiper(swiperEl, {
          slidesPerView: 1,
          spaceBetween: 20,
          pagination: {
            el: swiperEl.nextElementSibling,
            clickable: true,
          },
          breakpoints: {
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          },
        });
      });
    } catch (error) {
      console.error('Error processing items:', error);
      const container = document.getElementById('products-container');
      container.innerHTML = `<p class="text-danger">Failed to process products.</p>`;
    } finally {
        document.getElementById('loader').style.display = 'none'; // Hide loader
    }
  })
  .catch(err => {
    console.error('Error fetching items:', err);
    const container = document.getElementById('products-container');
    container.innerHTML = `<p class="text-danger">Failed to load products.</p>`;
  });

