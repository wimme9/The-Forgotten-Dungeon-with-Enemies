// ================================================================
// ธีมกลางของเกม "Forgotten Dungeon" — สี/ฟอนต์/องค์ประกอบตกแต่ง
// ให้ทุก Scene (Menu, Pause, Victory, GameOver) เรียกใช้ร่วมกัน
// เพื่อให้หน้าตาเกมไปในทิศทางเดียวกันทั้งหมด (ธีมดันเจี้ยน/คบเพลิง/ทองคำ)
// ================================================================

export const Theme = {
    color: {
        // สีพื้นหลัง/แผงกรอบ (โทนหินถ้ำ/ไม้เก่า)
        bgTopHex: 0x140d0a,
        bgBottomHex: 0x2b1c10,
        panelHex: 0x1f140d,

        // สีกรอบ/เส้นขอบ (ทองคำ)
        borderHex: 0x8a6d3b,
        borderBrightHex: 0xd4af37,

        // สี CSS (ใช้กับ text)
        gold: "#d4af37",
        goldBright: "#f1d38a",
        parchment: "#e8dcc0",
        torch: "#e8974e",
        blood: "#8b1e1e",
        bloodBright: "#e74c3c",
        emerald: "#4fd17a",
        emeraldBright: "#8af5a8",
        white: "#f5f0e6"
    },
    font: {
        // ฟอนต์หัวเรื่อง สไตล์แฟนตาซี/ยุคกลาง ใช้กับข้อความอังกฤษตัวใหญ่
        title: '"Cinzel", "Times New Roman", serif',
        // ฟอนต์เนื้อหา รองรับภาษาไทยชัดเจน อ่านง่าย
        body: '"Noto Sans Thai", "Segoe UI", sans-serif'
    }
};

// ----------------------------------------------------------------
// วาดแผงกรอบตกแต่งสไตล์ดันเจี้ยน (เงา + กรอบทองคำสองชั้น + มุมเพชร)
// ใช้ซ้ำได้ทุก Scene ที่ต้องการกรอบข้อความ/เมนู
// ----------------------------------------------------------------
export function drawOrnatePanel(scene, x, y, w, h) {
    const g = scene.add.graphics();

    // เงาใต้แผง
    g.fillStyle(0x000000, 0.55);
    g.fillRoundedRect(x - w / 2 + 6, y - h / 2 + 8, w, h, 14);

    // ตัวแผงหลัก
    g.fillStyle(Theme.color.panelHex, 0.96);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);

    // กรอบทองคำชั้นนอก
    g.lineStyle(3, Theme.color.borderBrightHex, 1);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);

    // กรอบบางชั้นในให้ดูมีมิติ
    g.lineStyle(1, Theme.color.borderHex, 0.8);
    g.strokeRoundedRect(x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, 10);

    // จุดเพชรตกแต่งมุมทั้งสี่
    const corners = [
        [x - w / 2 + 8, y - h / 2 + 8],
        [x + w / 2 - 8, y - h / 2 + 8],
        [x - w / 2 + 8, y + h / 2 - 8],
        [x + w / 2 - 8, y + h / 2 - 8]
    ];
    g.fillStyle(Theme.color.borderBrightHex, 1);
    corners.forEach(([cx, cy]) => g.fillCircle(cx, cy, 4));

    return g;
}

// ----------------------------------------------------------------
// สร้างปุ่มกดสไตล์เดียวกันทั้งเกม พร้อม hover glow + คลิก
// ----------------------------------------------------------------
export function createButton(scene, x, y, label, options = {}) {
    const {
        fontSize = "30px",
        colorNormal = Theme.color.gold,
        colorHover = Theme.color.goldBright,
        fontFamily = Theme.font.title,
        onClick = () => {}
    } = options;

    const btn = scene.add.text(x, y, label, {
        fontFamily,
        fontSize,
        color: colorNormal,
        backgroundColor: "#2b1c10",
        padding: { x: 26, y: 12 }
    }).setOrigin(0.5);

    btn.setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => { btn.setColor(colorHover); btn.setScale(1.05); });
    btn.on("pointerout", () => { btn.setColor(colorNormal); btn.setScale(1); });
    btn.on("pointerdown", onClick);

    return btn;
}

// ----------------------------------------------------------------
// สร้างข้อความหัวเรื่องพร้อมเงาใต้ตัวอักษร (ให้ดูมีมิติ/เด่นขึ้น)
// ----------------------------------------------------------------
export function createTitleText(scene, x, y, label, options = {}) {
    const {
        fontSize = "56px",
        color = Theme.color.goldBright,
        fontFamily = Theme.font.title
    } = options;

    scene.add.text(x + 3, y + 3, label, {
        fontFamily, fontSize, color: "#000000"
    }).setOrigin(0.5).setAlpha(0.5);

    return scene.add.text(x, y, label, {
        fontFamily, fontSize, color
    }).setOrigin(0.5);
}