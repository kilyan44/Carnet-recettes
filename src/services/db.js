import { Redis } from "@upstash/redis";
import { initialRecipes } from "../defaultRecipes";

const redisUrl =
  import.meta.env.VITE_KV_REST_API_URL ||
  import.meta.env.VITE_UPSTASH_REDIS_REST_URL;

const redisToken =
  import.meta.env.VITE_KV_REST_API_TOKEN ||
  import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

let redis = null;
if (redisUrl && redisToken) {
  try {
    redis = new Redis({ url: redisUrl, token: redisToken });
  } catch (err) {
    console.error("Erreur init Redis :", err);
  }
}

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
      await redis.set(REDIS_KEY, initialRecipes);
      return initialRecipes;
    } catch (e) {
      console.warn("Échec requête Upstash, bascule locale :", e);
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
    console.error("Erreur persistance :", e);
  }
}