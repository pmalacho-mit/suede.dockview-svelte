import { mount } from "svelte";
import "../release/styles/dockview.css";
import App from "../suede.sweater-vest/page/App.svelte";

export default mount(App, { target: document.getElementById("app")! });
