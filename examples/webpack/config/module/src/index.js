import fetchUser from "./fetchUser";
import "./jquery";

export default function() {
  (async function() {
    const users = await fetchUser();
    console.log(users);
  })();
}
