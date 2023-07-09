// Login Component
const login = {
  data() {
    return {
      email: "",
      password: "",
      remember: false,
      loading: false,
      error: false,
      error_message: "",
    };
  },
  methods: {
    validateEmail(mail) {
      if (
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
          mail
        )
      ) {
        return true;
      }
      return false;
    },
    async login(e) {
      this.loading = true;
      this.error = false;

      if (this.email == "") {
        this.error = true;
        this.message = "email_empty";
      }

      if (!this.validateEmail(this.email)) {
        this.error = true;
        this.message = "incorrect_email";
      }

      if (this.password == "") {
        this.error = true;
        this.message = "password_empty";
      }
      this.loading = false;

      if (!this.error) {
        return true;
      }

      e.preventDefault();
    },
  },
};

Vue.createApp(login).mount("#login_form");