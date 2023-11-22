<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $selectedOption = $_POST["optionsRadios"];
    $title = $_POST["optionsRadios_title"];
    $priceForOne = $_POST["priceForOne"];
    $priceForTwo = $_POST["priceForTwo"];
    $priceForThree = $_POST["priceForThree"];
    $priceForFour = $_POST["priceForFour"];

    $fileName = "data.json";
    $existingData = [];

    if (file_exists($fileName)) {
        $existingData = json_decode(file_get_contents($fileName), true);
    }

    $duplicateConsole = false;

    foreach ($existingData["consoles"] as $console) {
        if ($console["name"] === $selectedOption) {
            // Console already exists, set flag and break the loop
            $duplicateConsole = true;
            break;
        }
    }
    

    if (!$duplicateConsole) {
        $newConsole = [
            "name" => $selectedOption,
            "title" => $title,
            "one_player_price" => $priceForOne,
            "two_player_price" => $priceForTwo,
            "three_player_price" => $priceForThree,
            "four_player_price" => $priceForFour
        ];

        $existingData["consoles"][] = $newConsole;

        $jsonData = json_encode($existingData, JSON_UNESCAPED_UNICODE);

        if (file_put_contents($fileName, $jsonData)) {
            header("Location: console.html");
        } else {
            echo "خطا در ذخیره اطلاعات در فایل.";
        }
    } else {
         $errorJson = json_encode(['error' => ' کنسول تکراری است.'],JSON_UNESCAPED_UNICODE);
        header('Content-Type: application/json');
        header("Location: console.html");
        
        
        exit();
          
    }
}
?>

