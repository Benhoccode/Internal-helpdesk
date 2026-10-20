import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

// Optional browser check. PLAYWRIGHT_MODULE_PATH can point to an existing local installation.
export async function checkOperationsInBrowser(apiUrl: string, adminToken: string, employeeToken: string, categoryId: number, employeePassword: string) {
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
  const origin = "http://127.0.0.1:5191";
  const vite = spawn(process.execPath, [resolve("../client/node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", "5191", "--strictPort"], {
    cwd: resolve("../client"), env: { ...process.env, VITE_API_URL: apiUrl }, windowsHide: true, stdio: "pipe",
  });
  let browser: any;
  try {
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(() => reject(new Error("Vite startup timeout")), 20000);
      vite.stdout.on("data", chunk => {
        if (String(chunk).includes("Local:")) { clearTimeout(timer); resolveReady(); }
      });
      vite.on("exit", code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); });
      vite.on("error", reject);
    });
    browser = await chromium.launch({ headless: true, channel: "msedge" });
    const adminContext = await browser.newContext();
    const employeeContext = await browser.newContext();
    await adminContext.addInitScript((token: string) => localStorage.setItem("helpdesk_token", token), adminToken);
    await employeeContext.addInitScript((token: string) => localStorage.setItem("helpdesk_token", token), employeeToken);
    const adminPage = await adminContext.newPage();
    const employeePage = await employeeContext.newPage();
    await adminPage.goto(origin + "/users");
    await adminPage.getByLabel("Họ tên", { exact: true }).fill("Browser Support");
    await adminPage.getByLabel("Email", { exact: true }).fill("browser-support@test.invalid");
    await adminPage.getByLabel("Mật khẩu ban đầu").fill("Browser-Support-Password-123!");
    await adminPage.getByRole("combobox", { name: /^Vai trò/ }).selectOption("ADMIN");
    await adminPage.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
    await adminPage.getByRole("cell", { name: "browser-support@test.invalid", exact: true }).waitFor();
    await employeePage.goto(origin + "/tickets/new");
    await employeePage.locator("#title").fill("Browser workflow test");
    await employeePage.locator("#description").fill("Testing the complete support workflow.");
    await employeePage.locator("#category").selectOption(String(categoryId));
    await employeePage.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
    await employeePage.waitForURL(/\/tickets\/\d+$/);
    const path = new URL(employeePage.url()).pathname;
    await adminPage.goto(origin + path);
    await adminPage.getByRole("combobox", { name: /^Người xử lý/ }).selectOption({ label: "Browser Support" });
    await adminPage.waitForFunction(() => !document.querySelector<HTMLSelectElement>(".detail-controls select")?.disabled);
    await adminPage.getByRole("combobox", { name: /^Trạng thái/ }).selectOption("IN_PROGRESS");
    await adminPage.waitForFunction(() => !document.querySelector<HTMLSelectElement>(".detail-controls select")?.disabled);
    await adminPage.getByPlaceholder("Viết phản hồi hoặc bổ sung thông tin...").fill("Browser support reply");
    await adminPage.getByRole("button", { name: "Gửi bình luận" }).click();
    await adminPage.getByText("Browser support reply", { exact: true }).waitFor();
    await employeePage.getByRole("button", { name: /^Thông báo,/ }).click();
    const notice = employeePage.locator(".notification-item").filter({ hasText: "Có bình luận mới" }).first();
    await notice.waitFor();
    await notice.click();
    await employeePage.getByRole("button", { name: /^Thông báo,/ }).click();
    await employeePage.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }).click();
    await employeePage.getByRole("button", { name: "Thông báo, 0 chưa đọc", exact: true }).waitFor();
    await employeePage.getByRole("button", { name: "Đóng thông báo", exact: true }).click();
    await employeePage.goto(origin + "/users");
    await employeePage.waitForURL(origin + "/");
    await employeePage.goto(origin + "/account/password");
    await employeePage.getByLabel("Mật khẩu hiện tại").fill(employeePassword);
    await employeePage.getByLabel("Mật khẩu mới", { exact: true }).fill("Browser-Changed-Password-123!");
    await employeePage.getByLabel("Xác nhận mật khẩu mới").fill("Browser-Changed-Password-123!");
    await employeePage.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
    await employeePage.waitForURL(origin + "/login");
    assert.equal(await employeePage.evaluate(() => localStorage.getItem("helpdesk_token")), null);
    await employeePage.getByRole("status").filter({ hasText: "Đã đổi mật khẩu" }).waitFor();
    console.log("PASS: browser account creation, ticket creation, assignment, status, comment, notifications/read-all, admin guard, password change/logout");
  } finally {
    await browser?.close();
    vite.kill();
  }
}
