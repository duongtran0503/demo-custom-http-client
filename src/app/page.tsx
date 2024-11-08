import { HttpClient } from '@/lib/httpClient';

export default async function Home() {
    const axios = new HttpClient('https://jsonplaceholder.typicode.com');
    const res = await axios.get('users');
    console.log(res);
    return <div>call</div>;
}
