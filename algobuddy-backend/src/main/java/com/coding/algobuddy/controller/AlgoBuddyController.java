package com.coding.algobuddy.controller;
import com.coding.algobuddy.models.AlgoBuddy;
import com.coding.algobuddy.service.AlgoBuddyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/buddy")
@CrossOrigin(origins = "*")
public class AlgoBuddyController {

    private AlgoBuddyService algobuddyservice;

    public AlgoBuddyController(AlgoBuddyService algobuddyservice) {
        this.algobuddyservice = algobuddyservice;
    }

    @PostMapping("/process")
    public ResponseEntity<String> processContent(@RequestBody AlgoBuddy algo){
        String result = algobuddyservice.processContent(algo);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }


}
