import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Завантажуємо змінні середовища з файлу .env
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // ВАЖЛИВО: base: './' критичний для Telegram Mini Apps, 
        // щоб шляхи були відносними, а не абсолютними.
        base: './',

        server: {
            port: 3000,
            host: '0.0.0.0', // Дозволяє доступ по локальній мережі
        },

        build: {
            outDir: 'dist', // Папка, куди збережеться готовий сайт
            assetsDir: 'assets',
            emptyOutDir: true, // Очищає папку перед кожною збіркою
            sourcemap: false, // Прибирає зайві файли налагодження (зменшує вагу)
        },

        plugins: [react()],

        // Передача змінних у код. 
        // Додано "|| ''", щоб уникнути краху, якщо ключа немає.
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
        },

        resolve: {
            alias: {
                // Вказує, що @ це коренева папка (зручно для імпортів)
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});