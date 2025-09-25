package com.coding.algobuddy.service;

import com.coding.algobuddy.ai.response.GeminiResponse;
import com.coding.algobuddy.models.AlgoBuddy;
import com.coding.algobuddy.prompt.Prompt;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class AlgoBuddyService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final Prompt prompt;

    public AlgoBuddyService(WebClient.Builder webClientBuilder , ObjectMapper objectMapper, Prompt prompt) {
        this.webClient = webClientBuilder.build();
        this.objectMapper=objectMapper;
        this.prompt=prompt;
    }

    public String processContent(AlgoBuddy algo) {
        //Build the prompt
        String prompt = buildPrompt(algo);
        //query the AI Model API
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        //parse the response

        //return response

        return extractTextFromResponse(response);

    }

    private String extractTextFromResponse(String response) {
        try {
            GeminiResponse geminiResponse = objectMapper.readValue(response,GeminiResponse.class);
            if(geminiResponse.getCandidates()!=null && !geminiResponse.getCandidates().isEmpty()){
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);
                if(firstCandidate.getContent() != null
                        && firstCandidate.getContent().getParts() != null
                        && !firstCandidate.getContent().getParts().isEmpty()){
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
        }
        catch (Exception e){
            return "Error Parsing" +e.getMessage();
        }
        return "No content found ";
    }

    private String buildPrompt(AlgoBuddy algo){
       String finalPrompt="";
        switch (algo.getOperation()){
            case "Hint":
                System.out.println(algo.getCurrentSolution());
               finalPrompt= prompt.getHintPrompt(algo);

                break;
            case "Code":
                finalPrompt = prompt.getSolutionPrompt(algo);
                break;
            case "Procedure":
                finalPrompt=prompt.getProcedurePrompt(algo);
                break;
            default:
                throw new IllegalArgumentException("Unknown Operation:"+algo.getOperation());
        }
        return finalPrompt;
    }

}
