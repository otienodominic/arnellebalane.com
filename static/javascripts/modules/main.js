import { $, template, element } from './utils';
import ifm from '../lib/idb-fetch-mirror';

document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    fetchApiData();
});



// Fetch api data from backend

function fetchApiData() {
    ifm.mirror('/github-activity').then((response) => {
        const projects = $('.projects');
        response.forEach((project) => {
            const projectTemplate = $('template#project').innerHTML;
            const rendered = element(template(projectTemplate, project));
            projects.appendChild(rendered);
        });
    });
}



// Make web app "progressive"

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(handleRegisterSuccess)
            .catch(handleRegisterFailure);
    }
}

function handleRegisterSuccess(registration) {
    console.log('Service Worker Registered');
}

function handleRegisterFailure(error) {
    console.error(error);
}
