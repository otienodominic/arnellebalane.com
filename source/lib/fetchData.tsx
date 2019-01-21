import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.API_ENDPOINT
});

export default function fetchData(path) {
    const extension = process.env.API_PATH_EXTENSION;
    if (extension && !path.endsWith(extension)) {
        path += extension;
    }

    return instance.get(path);
}
