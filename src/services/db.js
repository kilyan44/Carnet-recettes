import { Redis } from "@upstash/redis";
import { initialRecipes } from "../defaultRecipes";

const redisUrl = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken)
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const REDIS_KEY = "carnet_recettes";
const LOCAL_KEY = "carnet-recettes-v1";

export async function fetchRecipes() {
  if (redis) {
    try {
      const data = await redis.get(REDIS_KEY);
      if (data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
        return data;
      }
      // Première initialisation si la base est vide
      await redis.set(REDIS_KEY, initialRecipes);
      return initialRecipes;
    } catch (e) {
      console.warn("Échec Upstash, bascule sur localStorage :", e);
    }
  }
  const cached = localStorage.getItem(LOCAL_KEY);
  return cached ? JSON.parse(cached) : initialRecipes;
}

export async function persistRecipes(recipes) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(recipes));
    if (redis) {
      await redis.set(REDIS_KEY, recipes);
    }
  } catch (e) {
    console.error("Erreur de sauvegarde :", e);
  }
}