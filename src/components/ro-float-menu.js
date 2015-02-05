(function (){

  xtag.register ('ro-float-menu', {
    lifecycle: {
      created: function () {
        this.xtag.itemsAreVisible = false;

        this.xtag.overlay = document.createElement('ro-overlay');        
        this.xtag.hitArea = document.createElement('ro-hitarea');
      },
      inserted: function () {

        this.appendChild(this.xtag.hitArea);
        this.parentElement.appendChild (this.xtag.overlay);

        var clickCallback = function (e) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleMenu ();                   
        }

        this.xtag.hitArea.onclick = clickCallback.bind(this);

      },
      removed: function () {
      }
    },
    events: {
      reveal: function () {
      }
    },
    accessors: {   
    },
    methods: {
      addItem: function (item) {
      },
      removeItem: function (item) {
      },
      toggleMenu: function () {
        if (this.xtag.itemsAreVisible) {
           this.hideItems ();
        } else {
          this.showItems ();
        }
      },
      hideItems: function () {
        this.setAttribute('state', 'hideItems');
        this.xtag.overlay.setAttribute('state', 'hideItems');

        this.xtag.itemsAreVisible = false;
      },
      showItems: function (items) {
        this.setAttribute('state', 'showItems');
        this.xtag.overlay.setAttribute('state', 'showItems');
        this.xtag.itemsAreVisible = true;
      },
      parseList: function () {
      }
    }
  });

})();