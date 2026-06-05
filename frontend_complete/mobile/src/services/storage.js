import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "site_evenementiel_token";
const USER_KEY = "site_evenementiel_user";

export async function readSession() {
  const [token, rawUser] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);

  let user = null;

  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return { token, user };
}

export async function saveSession(token, user) {
  const tasks = [];

  if (token) {
    tasks.push(AsyncStorage.setItem(TOKEN_KEY, token));
  } else {
    tasks.push(AsyncStorage.removeItem(TOKEN_KEY));
  }

  if (user) {
    tasks.push(AsyncStorage.setItem(USER_KEY, JSON.stringify(user)));
  } else {
    tasks.push(AsyncStorage.removeItem(USER_KEY));
  }

  await Promise.all(tasks);
}

export async function clearSession() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}

export async function readToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
