## file storage and embedded database, simple to use.


### Usage

- file storage
	```ts
	import { FileManager } from "https://deno.land/x/data_manager@v1.0.1/mod.ts";
	
	const fileManager = new FileManager("./files");
	const file = await fileManager.saveFileByPath("./1.pdf");
	console.log(file);

	```

- database
```ts
import { DataStore, SortMode } from "https://deno.land/x/data_manager@v1.0.1/mod.ts";
interface User {
	name: string;
	age: number;
}
const dataStore = new DataStore<User>("./user.json");
await dataStore.insert({ name: "tom", age: 10 }, { name: "jerry", age: 7 }, { name: "loopy", age: 5 });
let users = await dataStore.query((record) => record.age > 5, { offset: 1, limit: 1 });
console.log(users);
users = await dataStore.query((record) => record.age > 5, { sortField: "age", sortMode: SortMode.up });
console.log(users);

```

