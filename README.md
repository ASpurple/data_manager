## file storage and embedded database, simple to use.


### Usage

- file storage
        ```ts
        import { FileManager, FilePermission } from "https://deno.land/x/data_manager@v1.0.3/mod.ts";

        const fileManager = new FileManager("./files");
        
        // Save file from local path
        const file = await fileManager.saveFileByPath("./1.pdf");
        console.log(file);
        
        // Save file from URI (HTTP/HTTPS)
        const fileFromUri = await fileManager.saveFileByUri("https://example.com/sample.pdf");
        console.log(fileFromUri);
        
        // Save file from URI with custom options
        const customFile = await fileManager.saveFileByUri("https://example.com/data.json", {
          fileName: "custom_name.json",
          description: "Custom file description",
          permission: FilePermission.personal
        });
        console.log(customFile);
        ```

- database
```ts
import { DataStore, SortMode } from "https://deno.land/x/data_manager@v1.0.3/mod.ts";
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

