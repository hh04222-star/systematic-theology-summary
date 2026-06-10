import json
import os

def generate_markdown():
    json_path = os.path.join("data", "theologians.json")
    output_path = "theology_summary.md"
    
    with open(json_path, "r", encoding="utf-8") as f:
        theologians = json.load(f)
        
    # Chronological sorting helper
    def parse_birth_year(years_str):
        clean = years_str.replace(" ", "").upper()
        if "BC" in clean:
            import re
            m = re.search(r"BC(\d+)", clean)
            return -int(m.group(1)) if m else -9999
        import re
        m = re.search(r"(\d+)", clean)
        return int(m.group(1)) if m else 9999
        
    # Sort dataset chronologically first (matching app.js)
    theologians.sort(key=lambda t: (parse_birth_year(t["years"]), t["name_ko"]))

    # Split into theologians and philosophers
    traditional_theologians = [t for t in theologians if t.get("is_theologian", True)]
    philosophers = [t for t in theologians if not t.get("is_theologian", True)]

    md = []
    md.append("# 🌟 조직신학자 핵심 요약본 (Systematic Theology Summary)")
    md.append("\n이 요약본은 교회사 속 주요 조직신학자들의 핵심 사상과 신학 체계를 일목요연하게 정리한 자료입니다. 각 신학자의 주요 저작, 핵심 개념, 그리고 교의학의 핵심 주제별(신론, 기독론, 구원론, 교회/성례론, 종말론) 견해와 역사적 의의를 다룹니다.\n")
    
    # Table of Contents
    md.append("## 📌 목차 (Table of Contents)")
    
    # Group theologians by era
    eras = {}
    for t in traditional_theologians:
        era_ko = t["era_ko"]
        if era_ko not in eras:
            eras[era_ko] = []
        eras[era_ko].append(t)
        
    # Render Theologians in TOC
    md.append("\n### 📚 시대별 주요 조직신학자")
    for era, list_t in eras.items():
        md.append(f"\n#### ▫️ {era}")
        for t in list_t:
            md.append(f"- [{t['name_ko']} ({t['name_en']})](#-{t['id']}) - {t['years']}")
            
    # Render Philosophers in TOC
    md.append("\n### 🧠 외부 철학자 및 사상가")
    for t in philosophers:
        md.append(f"- [{t['name_ko']} ({t['name_en']}) [사상가/철학자]](#-{t['id']}) - {t['years']}")
        
    md.append("\n---\n")
    
    # Helper to render profile details
    def render_profile(t, is_philosopher=False):
        header_tag = " [사상가/철학자]" if is_philosopher else ""
        md.append(f"## <a id=\"-{t['id']}\"></a>👤 {t['name_ko']} ({t['name_en']}){header_tag}")
        md.append(f"- **시대 및 분류:** {t['era_ko']}{' (외부 철학자 및 사상가)' if is_philosopher else ''}")
        md.append(f"- **활동 시기:** {t['years']}")
        md.append(f"- **활동 지역:** {t['region']}")
        
        if "influenced_by" in t and t["influenced_by"]:
            by = ", ".join(t["influenced_by"])
            md.append(f"- **영향을 받은 인물 (사상적 계보):** {by}")
            
        if "influenced_them" in t and t["influenced_them"]:
            them = ", ".join(t["influenced_them"])
            md.append(f"- **영향을 미친 인물 (후대 영향):** {them}")
        
        # Tags
        tags = " ".join([f"`#{tag}`" for tag in t["key_themes"]])
        md.append(f"- **핵심 키워드:** {tags}\n")
        
        md.append("### 📝 한 줄 요약")
        md.append(f"> {t['summary']}\n")
        
        md.append("### 📚 주요 저작")
        for work in t["key_works"]:
            md.append(f"- {work}")
        md.append("")
        
        md.append("### 🔍 주요 교의별 핵심 사상 (Systematic Loci)")
        
        # Table for Loci
        md.append("| 교의학 주제 (Locus) | 핵심 내용 |")
        md.append("| :--- | :--- |")
        
        loci_map = {
            "theology_proper": "**신론 (Theology Proper)**",
            "christology": "**기독론 (Christology)**",
            "soteriology": "**구원론 (Soteriology)**",
            "ecclesiology_sacraments": "**교회 및 성례론 (Ecclesiology & Sacraments)**",
            "eschatology": "**종말론 (Eschatology)**"
        }
        
        for key, name in loci_map.items():
            content = t["core_doctrines"].get(key, "해당 분야에 대한 특별한 신학적 진술 없음")
            content = content.replace("\n", " ")
            md.append(f"| {name} | {content} |")
            
        # Key Concepts Glossary
        if "key_concepts" in t and t["key_concepts"]:
            md.append("\n### 🔑 주요 신학 개념 해설 (Key Concepts)")
            for concept in t["key_concepts"]:
                md.append(f"- **{concept['term']}**: {concept['definition']}")
            
        md.append("\n### 💬 대표 명언")
        md.append(f"> \"{t['famous_quote']}\"\n")
        
        md.append("### 🏛️ 역사적 영향 및 의의")
        md.append(f"{t['impact']}\n")
        
        md.append("---\n")

    # Render Theologians Details
    md.append("# 📚 시대별 주요 조직신학자 상세 정보\n")
    for t in traditional_theologians:
        render_profile(t, is_philosopher=False)

    # Render Philosophers Details
    md.append("# 🧠 외부 철학자 및 사상가 상세 정보\n")
    for t in philosophers:
        render_profile(t, is_philosopher=True)
        
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
        
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    generate_markdown()
