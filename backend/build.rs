#[cfg(not(debug_assertions))]
use static_files::resource_dir;

fn main() -> std::io::Result<()> {
    println!("cargo::rerun-if-changed=../frontend/dist");
    #[cfg(not(debug_assertions))]
    return resource_dir("../frontend/dist").build();
    #[cfg(debug_assertions)]
    return Ok(());
}
