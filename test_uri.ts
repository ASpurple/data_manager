import { FileManager, FilePermission } from "./mod.ts";

// 创建文件管理器实例
const fileManager = new FileManager("./test_files");

// 测试从URI保存文件
async function testSaveFileByUri() {
  console.log("Testing saveFileByUri method...");
  
  // 测试1: 使用公共图片URL
  const imageUrl = "https://deno.land/logo.svg";
  console.log(`Saving file from URI: ${imageUrl}`);
  const file1 = await fileManager.saveFileByUri(imageUrl);
  console.log("File saved:", file1);
  
  // 测试2: 使用自定义文件名和描述
  const jsonUrl = "https://deno.land/x/data_manager@v1.0.3/deno.json";
  console.log(`Saving file from URI with custom name: ${jsonUrl}`);
  const file2 = await fileManager.saveFileByUri(jsonUrl, {
    fileName: "custom_config.json",
    description: "Custom configuration file",
    permission: FilePermission.personal
  });
  console.log("File saved with custom options:", file2);
  
  // 测试3: 无效URI
  console.log("Testing with invalid URI...");
  const invalidUri = "invalid-uri";
  const file3 = await fileManager.saveFileByUri(invalidUri);
  console.log("Result with invalid URI:", file3);
}

// 运行测试
await testSaveFileByUri();