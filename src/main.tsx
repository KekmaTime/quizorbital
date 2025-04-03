import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QuizProvider } from './lib/QuizContext'

createRoot(document.getElementById("root")!).render(
  <QuizProvider>
    <App />
  </QuizProvider>
);
