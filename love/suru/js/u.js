
import { LanguageManager } from "./g.js";
import { CSRFManager } from "./f.js";
import { SignupValidation } from "./v.js";
import { SignupAPI } from "./a.js";

export class SignupApp {

    #form;
    #language;
    #message;
    #submitBtn;
    #languages;
    #csrf;
    #ready = false;

    constructor(a = document) {

        // Get existing element OR create new element
        const getOrCreate = (parent, tag, id) => {

            let element = a.getElementById(id);

            if (element) {
                return element;
            } else {
                element = a.createElement(tag);
                element.id = id;
                parent.appendChild(element);
                return element;
            }
        };

        // Signup Form
        this.#form = getOrCreate(
            a.body,
            "form",
            "signupForm"
        );

        // Language Selector
        this.#language = getOrCreate(
            this.#form,
            "select",
            "language"
        );

        // Message Element
        this.#message = getOrCreate(
            this.#form,
            "div",
            "message"
        );

        // Submit Button
        this.#submitBtn = getOrCreate(
            this.#form,
            "button",
            "submitBtn"
        );

        this.#form.method = "POST";
        this.#submitBtn.type = "submit";

        if (!this.#submitBtn.textContent.trim()) {
            this.#submitBtn.textContent = "Create Account";
        }

        this.#languages = new LanguageManager(
            this.#language
        );

        this.#csrf = new CSRFManager();

        this.init();
    }

    #setMessage(t, k = "") {

        this.#message.textContent = t;

        this.#message.className = k
            ? `message ${k}`
            : "message";
    }

    async handleLanguageChange() {

        try {

            await this.#languages.load(
                this.#language.value
            );

            this.#setMessage("");

        } catch (e) {

            this.#setMessage(
                e.message,
                "error"
            );
        }
    }

    async #handleSubmit(e) {

        e.preventDefault();

        if (!this.#ready) return;

        this.#setMessage("");

        const d = Object.fromEntries(
            new FormData(this.#form)
        );

        try {

            SignupValidation.validate(
                d,
                this.#languages.translations
            );

            d.csrf_token = this.#csrf.token;

            this.#submitBtn.disabled = true;

            const r = await SignupAPI.register(d);

            this.#setMessage(
                this.#languages.translations.success ||
                r.message ||
                "Registration successful!",
                "success"
            );

            this.#form.reset();

        } catch (e) {

            this.#setMessage(
                e.message,
                "error"
            );

        } finally {

            try {

                await this.#csrf.refresh();

            } catch {

                this.#ready = false;
            }

            this.#submitBtn.disabled = !this.#ready;

            this.#submitBtn.textContent =
                this.#languages.translations.signup ||
                "Create Account";
        }
    }

    async init() {

        this.#submitBtn.disabled = true;

        this.#language.addEventListener(
            "change",
            () => this.handleLanguageChange()
        );

        this.#form.addEventListener(
            "submit",
            e => this.#handleSubmit(e)
        );

        try {

            await this.#languages.init();

            await this.#csrf.refresh();

            this.#ready = true;

        } catch (e) {

            this.#setMessage(
                e.message,
                "error"
            );
        }

        this.#submitBtn.disabled = !this.#ready;
    }

    get ready() {
        return this.#ready;
    }

    get currentLanguage() {
        return this.#languages.currentLanguage;
    }

    get translations() {
        return this.#languages.translations;
    }
}
